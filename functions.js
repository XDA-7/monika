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
 * @typedef {Object} RouletteResult
 * @property {string} error
 * @property {string} message
 * @property {Array<number>} numbersSpun
 */

/**
 * @typedef {Object} Card
 * @property {boolean} isBlack
 * @property {number} value
 */

/**
 * @param {string} username
 */
module.exports.getCredits = function (username) {
    return db.getPlayer(username).credits
}

/**
 * @param {string} username
 * @param {number} betAmount
 * @param {number} guess
 * @returns {GameResult}
 */
module.exports.dice = function (username, betAmount, guess) {
    var player = db.getPlayer(username)
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
        message: 'Rolled a ' + dieOne + ' and a ' + dieTwo + ' for ' + roll + ' total' + appendPayout(payout, player.credits)
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
    if (player.credits < betAmount) {
        return { error: 'you don\'t have that many credits to bet, you currrently have ' + player.credits }
    }
    
    db.setLastBlackjackBet(username, betAmount)
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
        monikaHand: getHandString(monikaCards),
        message: 'You\'re now on ' + blackjackHandValue(playerCards)
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
        var player = db.getPlayer(username)
        game.gameEnded = true
        message = 'You went bust' + appendPayout(-game.betAmount, player.credits)
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
    var player = db.getPlayer(username)
    if (!game) {
        return { error: 'you aren\'t currently in a game' }
    }

    var monikaHandValue = blackjackHandValue(game.monikaHand)
    var playerHandValue = blackjackHandValue(game.playerHand)
    while (monikaHandValue < 17 && monikaHandValue < playerHandValue) {
        game.monikaHand.push(randomCard())
        monikaHandValue = blackjackHandValue(game.monikaHand)
    }

    var message = ''
    if (monikaHandValue > 21 || monikaHandValue < playerHandValue) {
        // payout of 3:2 but the bet amount was already deducted from the player
        player.credits += Math.floor(game.betAmount * 2.5)
        message = (monikaHandValue > 21) ? 'Dealer bust!' : 'You win!'
        message += appendPayout(Math.floor(game.betAmount * 1.5), player.credits)
    }
    else if (monikaHandValue == playerHandValue) {
        player.credits += Math.floor(game.betAmount)
        message = 'It\'s a tie'
    }
    else {
        message = 'House wins' +
        appendPayout(-game.betAmount, player.credits)
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
 * @param {string} username 
 * @param {Array<string>} args
 * @returns {GameResult} 
 */
module.exports.rouletteBet = function(username, args) {
    var betAmount = +args[0]
    if (isNaN(betAmount)) {
        return { error: 'You need to enter a bet amount' }
    }

    var player = db.getPlayer(username)
    if (betAmount > player.credits) {
        return { error: 'You\'ve tried to bet more than you have, you currently have ' + player.credits + ' credits' }
    }

    var game = db.getRouletteGame(username)

    var outsideBet = args[1]

    if (outsideBet == 'manque') {
        game.bets.push({ betAmount: betAmount, betSquares: db.rouletteManque })
    }
    else if (outsideBet == 'passe') {
        game.bets.push({ betAmount: betAmount, betSquares: db.roulettePasse })
    }
    else if (outsideBet == 'rouge') {
        game.bets.push({ betAmount: betAmount, betSquares: db.rouletteRouge })
    }
    else if (outsideBet == 'noir') {
        game.bets.push({ betAmount: betAmount, betSquares: db.rouletteNoir })
    }
    else if (outsideBet == 'pair') {
        game.bets.push({ betAmount: betAmount, betSquares: db.roulettePair })
    }
    else if (outsideBet == 'impair') {
        game.bets.push({ betAmount: betAmount, betSquares: db.rouletteImpair })
    }
    else if (outsideBet == 'dozen') {
        var dozenNumber = +args[2]
        if (isNaN(dozenNumber)) {
            return { error: 'You need to enter the dozen you want' }
        }
        
        if (dozenNumber < 1 || dozenNumber > 3) {
            return { error: 'You need to pick dozen 1, 2 or 3' }
        }

        game.bets.push({
            betAmount: betAmount,
            betSquares: db.rouletteDozens[dozenNumber - 1]
        })
    }
    else if (outsideBet == 'column') {
        var columnNumber = +args[2]
        if (!isNaN(columnNumber)) {
            return { error: 'You need to enter the column you want' }
        }

        if (columnNumber < 1 || columnNumber > 3) {
            return { error: 'You need to pick column 1, 2 or 3' }
        }

        game.bets.push({
            betAmount: betAmount,
            betSquares: db.rouletteColumns[columnNumber - 1]
        })
    }
    else {
        var insideBet = getBetSquares(args.slice(1))
        if (insideBet.isValid) {
            game.bets.push({ betAmount: betAmount, betSquares: insideBet.result })
        }
        else {
            return { error: 'Invalid bet' }
        }
    }

    player.credits -= betAmount
    return { message: 'Bet successful' }
}

/**
 * @typedef {Object} BetSquaresResult
 * @property {boolean} isValid
 * @property {Array<number>} result
 */

/**
 * @param {Array<string>} args
 * @returns {BetSquaresResult}
 */
function getBetSquares(args) {
    var numericArgs = args.map(function(arg) {
        return +arg
    })

    var containsNaNs = numericArgs.reduce(
        function(last, current) {
            return isNaN(current) || last
        },
        false
    )

    if (containsNaNs) {
        return { isValid: false }
    }
    
    numericArgs.sort()
    var isValidBet = false
    /**
     * @param {Array<Array<number>>} numberSet
     * @returns {boolean}
     */
    var argsTest = function(numberSet) { return containsNumberArray(numericArgs, numberSet) }
    if (numericArgs.length == 1) {
        isValidBet = true
    }
    else if (numericArgs.length == 2) {
        isValidBet = argsTest(db.rouletteSplits)
    }
    else if (numericArgs.length == 3) {
        isValidBet = argsTest(db.rouletteStreets) || argsTest(db.rouletteTrios)
    }
    else if (numericArgs.length == 4) {
        isValidBet = argsTest(db.rouletteCorners) || argsTest(db.rouletteFirstFour)
    }
    else if (numericArgs.length == 6) {
        isValidBet = argsTest(db.rouletteDoubleStreets)
    }

    if (isValidBet) {
        return { isValid: true, result: numericArgs }
    }

    return { isValid: false }
}

/**
 * @param {Array<number>} array 
 * @param {Array<Array<number>>} doubleArray 
 * @returns {boolean}
 */
function containsNumberArray(array, doubleArray) {
    var matchingArray = doubleArray.filter(function(testArray) {
        return array.reduce(
            function(last, current, index) {
                return last && (current == testArray[index])
            },
            true
        )
    })

    return matchingArray.length > 0
}

/**
 * @param {string} username 
 * @returns {RouletteResult}
 */
module.exports.rouletteSpin = function(username) {
    var game = db.getRouletteGame(username)
    var player = db.getPlayer(username)
    var finalNumberIndex = randomNumber(37) - 1
    var resultSet = db.rouletteWheel.slice(finalNumberIndex, finalNumberIndex + 6)
    var chosenNumber = resultSet[0]
    var totalBetAmount = 0
    var winnings = 0
    for (var i = 0; i < game.bets.length; i++) {
        var bet = game.bets[i]
        totalBetAmount += bet.betAmount
        var matchingNumbers = bet.betSquares.filter(function(number) {
            return number == chosenNumber
        })
        if (matchingNumbers.length == 1) {
            var betPayout = (36.0 / bet.betSquares.length)
            winnings += Math.floor(bet.betAmount * betPayout)
        }
    }

    player.credits += winnings
    game.gameEnded = true
    
    return {
        numbersSpun: resultSet,
        message: 'Round complete' + appendPayout(winnings - totalBetAmount, player.credits)
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
 * @param {number} playerCredits
 * @returns {string}
 */
function appendPayout(payout, playerCredits) {
    if (payout > 0) {
        return '\nYou have won ' + payout + ' credits!\nYou now have ' + playerCredits + ' credits'
    }
    else {
        return '\nYou have lost ' + -payout + ' credits\nYou now have ' + playerCredits + ' credits'
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
module.exports.getBetSquares = getBetSquares