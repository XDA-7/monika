var db = require('./db').db

/**
 * @typedef {Object} GameResult
 * @property {string} error
 * @property {string} message
 */

 /**
  * @typedef {Object} BlackjackResult
  * @property {string} error
  * @property {string} message
  * @property {string} handMessageId
  * @property {Array<string>} playerHand
  * @property {Array<string>} monikaHand
  */

/**
 * @typedef {Object} Card
 * @property {boolean} isBlack
 * @property {number} value
 */

/**
 * @param {string} username
 */
module.exports.start = function (username) {
    var player = db.getPlayer(username)
    if (player) {
        player.credits = 10000
    }
    else {
        db.players.push({ name: username, credits: 10000 })
    }
}

/**
 * @param {string} username
 */
module.exports.getCredits = function (username) {
    var player = db.getPlayer(username)
    if (player) {
        return player.credits
    }
    else {
        return -1
    }
}

/**
 * @param {string} username
 * @param {number} betAmount
 * @param {number} guess
 * @returns {GameResult}
 */
module.exports.dice = function (username, betAmount, guess) {
    var player = db.getPlayer(username)
    if (!player) {
        return { error: 'player was not found' }
    }

    if (player.credits < betAmount) {
        return { error: 'bet amount exceeds your credits, you have ' + player.credits + ' total credits' }
    }

    var payout = -betAmount
    var dieOne = randomNumber(6)
    var dieTwo = randomNumber(6)
    var roll = dieOne + dieTwo
    if (roll == guess) {
        payout += Math.floor(db.dicePayouts[roll] * betAmount)
    }

    player.credits += payout
    return {
        message: 'Rolled a ' + dieOne + ' and a ' + dieTwo + ' for ' + roll + ' total' + appendPayout(payout)
    }
}

/**
 * @param {string} username 
 * @param {number} betAmount
 * @returns {BlackjackResult}
 */
module.exports.startBlackjack = function (username, betAmount) {
    var existingGame = db.getBlackjackGame(username)
    if (existingGame) {
        return { error: 'you\'re already playing a game' }
    }

    var player = db.getPlayer(username)
    if (!player) {
        return { error: 'player not found' }
    }
    if (player.credits < betAmount) {
        return { error: 'you don\'t have that many credits to bet, you currrently have ' + player.credits }
    }

    player.credits -= betAmount
    var playerCards = [randomCard(), randomCard()]
    var monikaCards = [randomCard(), randomCard()]
    db.blackjackGames.push({
        username: username,
        playerHand: playerCards,
        monikaHand: monikaCards,
        playerSit: false,
        gameEnded: false,
        betAmount: betAmount
    })

    return {
        playerHand: getHandString(playerCards),
        monikaHand: getHandString(monikaCards)
    }
}

/**
 * @param {string} username 
 * @returns {BlackjackResult}
 */
module.exports.playerHitBlackjack = function(username) {
    var game = db.getBlackjackGame(username)
    if (!game) {
        return { error: 'you aren\'t currently in a game' }
    }

    var card = randomCard()
    game.playerHand.push(card)
    var value = blackjackHandValue(game.playerHand)
    var message = ''
    if (value > 21) {
        game.gameEnded = true
        message = 'You went bust' + appendPayout(-game.betAmount)
    }
    else {
        message = 'You\'re now on ' + value
    }

    return {
        message: message,
        playerHand: getHandString(game.playerHand),
        monikaHand: getHandString(game.monikaHand),
        handMessageId: game.handMessageId
    }
}

/**
 * @param {string} username
 * @returns {BlackjackResult}
 */
module.exports.playerSitBlackjack = function(username) {
    var game = db.getBlackjackGame(username)
    if (!game) {
        return { error: 'you aren\'t currently in a game' }
    }

    var monikaHandValue = blackjackHandValue(game.monikaHand)
    var playerHandValue = blackjackHandValue(game.playerHand)
    while (monikaHandValue < 17) {
        game.monikaHand.push(randomCard())
        monikaHandValue = blackjackHandValue(game.monikaHand)
    }

    var message = ''
    if (monikaHandValue > 21 || monikaHandValue < playerHandValue) {
        var player = db.getPlayer(username)
        // payout of 3:2 but the bet amount was already deducted from the player
        player.credits += Math.floor(game.betAmount * 2.5)
        message = (monikaHandValue > 21) ? 'Dealer bust!' : 'You win!'
        message += appendPayout(Math.floor(game.betAmount * 1.5))
    }
    else {
        message = 'House wins' +
        appendPayout(-game.betAmount)
    }

    game.gameEnded = true
    return {
        playerHand: getHandString(game.playerHand),
        monikaHand: getHandString(game.monikaHand),
        message: message,
        handMessageId: game.handMessageId
    }
}

/**
 * @returns {Card}
 */
function randomCard() {
    var value = randomNumber(13)
    var colorVal = randomNumber(2)
    if (colorVal == 1) {
        return { isBlack: true, value: value }
    }
    else {
        return { isBlack: false, value: value }
    }
}

/**
 * @param {number} range
 * @returns {number}
 */
function randomNumber(range) {
    return Math.floor(Math.random() * range) + 1
}

/**
 * @param {number} payout 
 * @returns {string}
 */
function appendPayout(payout) {
    if (payout > 0) {
        return '\nYou have won ' + payout + ' credits!'
    }
    else {
        return '\nYou have lost ' + -payout + ' credits'
    }
}

/**
 * @param {Array<Card>} hand
 * @returns {Array<string>} 
 */
function getHandString(hand) {
    return hand.map(function(card) {
        return getCardString(card)
    })
}

/**
 * @param {Card} card
 * @returns {string}
 */
function getCardString(card) {
    var color = card.isBlack ? 'black' : 'red'
    if (card.value <= 10) {
        return color + db.numberWords[card.value]
    }
    else if (card.value == 11) {
        return color + 'jack'
    }
    else if (card.value == 12) {
        return color + 'queen'
    }
    else if (card.value == 13) {
        return color + 'king'
    }
}

/**
 * @param {Array<Card>} hand 
 * @returns {number}
 */
function blackjackHandValue(hand) {
    var totalValue = 0
    var totalAces = 0
    hand.forEach(function(card) {
        if (card.value == 1) {
            totalAces++
            totalValue += 11
        }
        else if (card.value > 10) {
            totalValue += 10
        }
        else {
            totalValue += card.value
        }
    })

    while (totalValue > 21 && totalAces > 0) {
        totalValue -= 10
        totalAces--
    }

    return totalValue
}

module.exports.blackjackHandValue = blackjackHandValue