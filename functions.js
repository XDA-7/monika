var db = require('./db').db

/**
 * @typedef {Object} GameResult
 * @property {string} error
 * @property {string} message
 */

/**
 * @param {string} username
 */
module.exports.start = function start (username) {
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
module.exports.getCredits = function getCredits(username) {
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
module.exports.dice = function dice(username, betAmount, guess) {
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