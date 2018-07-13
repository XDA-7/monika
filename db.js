var fs = require('fs')
var Client = require('pg').Client

var connectionString = ''
if (process.env.DATABASE_URL) {
    connectionString = process.env.DATABASE_URL
}

var client = new Client({
    connectionString: connectionString,
    ssl: true
})

/**
 * @typedef {Object} Player
 * @property {string} name
 * @property {number} credits
 */

/**
 * @typedef {Object} Card
 * @property {boolean} isBlack
 * @property {number} value
 */

/**
 * @typedef {Object} BlackjackGame
 * @property {string} username
 * @property {Array<Card>} playerHand
 * @property {Array<Card>} monikaHand
 * @property {string} handMessageId
 * @property {boolean} playerSit
 * @property {boolean} gameEnded
 * @property {number} betAmount
 */

/**
 * @namespace
 */
var db = {
    /**
     * @type {Array<Player>}
     */
    players: [],

    /**
     * @type {Object}
     */
    dicePayouts: {
        2: 36,
        3: 18,
        4: 12,
        5: 9,
        6: (36 / 5),
        7: 6,
        8: (36 / 5),
        9: 9,
        10: 12,
        11: 18,
        12: 36
    },

    numberWords: ['', 'ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],

    cardEmojis: {
        redace: '462521806415200256',
        redtwo: '462521806524383243',
        redthree: '462521806557806593',
        redfour: '462521806348091392',
        redfive: '462521806331445258',
        redsix: '462521806662795265',
        redseven: '462521806486634498',
        redeight: '462521806457405440',
        rednine: '462521806436433920',
        redten: '462521806830567424',
        redjack: '462521806331576330',
        redqueen: '462521806817853440',
        redking: '462521806423851008',
        blackace: '462521805693911050',
        blacktwo: '462521806151090176',
        blackthree: '462521806079918107',
        blackfour: '462521805727334400',
        blackfive: '462521805605961740',
        blacksix: '462521805765083137',
        blackseven: '462521805618544642',
        blackeight: '462521805983449088',
        blacknine: '462521805848969226',
        blackten: '462521805937049601',
        blackjack: '462521805769539584',
        blackqueen: '462521805941506048',
        blackking: '462521805874135041',
        cardback: '464357956222189579'
    },

    /**
     * @type {Array<BlackjackGame>}
     */
    blackjackGames: [],

    /**
     * @param {string} username
     * @returns {Player}
     */
    getPlayer: function (username) {
        var player = this.players.filter(function(player) { return player.name == username })
        if (player.length == 0) {
            player.push({ name: username, credits: 10000 })
            this.players.push(player[0])
        }

        return player[0]
    },

    /**
     * @param {string} username
     * @returns {BlackjackGame}
     */
    getBlackjackGame: function (username) {
        var game = this.blackjackGames.filter(function(game) { return game.username == username && !game.gameEnded })
        if (game.length == 1) {
            return game[0]
        }
        
        return undefined
    },

    save: function() {
        client.query(
            'UPDATE game_state SET value = $1',
            [JSON.stringify(this)],
            function(err) {
                if (err) {
                    console.log(err.message)
                }
            }
        )
    },

    load: function() {
        var self = this
        client.connect()
        .then(function() {
            client.query('SELECT value FROM game_state', function(err, res) {
                if (err) {
                    console.log(err.message)
                }

                if (res.rowCount == 1) {
                    var gameState = JSON.parse(res.rows[0].value)
                    self.players = gameState.players
                    self.blackjackGames = gameState.blackjackGames
                }
                else {
                    client.query('INSERT INTO game_state (value) VALUES($1)', [JSON.stringify(self)])
                }
            })
        })
    },

    loadFromFile: function() {
        var self = this
        fs.readFile('db.json', function(err, data) {
            if (err) {
                console.log(err)
            }
            else {
                var gameState = JSON.parse(data) 
                self.players = gameState.players
                self.blackjackGames = gameState.blackjackGames
            }
        })
    },

    saveToFile: function() {
        fs.writeFile('db.json', JSON.stringify(this), function(err) {
            if (err) {
                console.log(err)
            }
        })
    },

    reset: function() {
        this.players = []
        this.blackjackGames = []
    },

    help:
    '!just: monika\n' +
    '!anxiety: some encouragement for when you\'re feeling down or inadequate\n' +
    '!credits: check your current credit balance\n' +
    '!reset: reset your credits to 10000\n' +
    '!dice: guess the result of a dice roll. First number is the amount you want to bet, second number is your guess\n' +
    '!blackjack: play a game of blackjack. Enter the amount you want to bet\n' +
    '!hit, !sit: options while in a game of blackjack'
}

if (connectionString == '') {
    db.save = db.saveToFile
    db.load = db.loadFromFile
}

module.exports.db = db
