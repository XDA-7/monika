var fs = require('fs')
var Client = require('pg').Client
var rouletteSets = require('./rouletteSets')

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
 * @typedef {Object} BlackjackLastBet
 * @property {string} username
 * @property {number} betAmount
 */

 /**
  * @typedef {Object} RouletteBet
  * @property {number} betAmount
  * @property {Array<number>} betSquares
  */

 /**
  * @typedef {Object} RouletteGame
  * @property {string} username
  * @property {boolean} gameEnded
  * @property {Array<RouletteBet>} bets
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
     * @type {Array<BlackjackLastBet>}
     */
    blackjackLastBets: [],

    /**
     * @type {Array<number>}
     */
    rouletteRouge: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],

    /**
     * @type {Array<number>}
     */
    rouletteNoir: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35],

    /**
     * @type {Array<number>}
     */
    rouletteManque: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],

    /**
     * @type {Array<number>}
     */
    roulettePasse: [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],

    /**
     * @type {Array<number>}
     */
    roulettePair: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],

    /**
     * @type {Array<number>}
     */
    rouletteImpair: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35],

    /**
     * @type {Array<Array<number>>}
     */
    rouletteDozens: [
        [ 1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12],
        [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
        [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]
    ],

    /**
     * @type {Array<Array<number>>}
     */
    rouletteColumns: [
        [ 1,  4,  7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
        [ 2,  5,  8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
        [ 3,  6,  9, 12, 15, 18, 21, 24, 27, 30, 33, 36]
    ],

    /**
     * @type {Array<Array<number>>}
     */
    rouletteSplits: rouletteSets.getSplits(),

    /**
     * @type {Array<Array<number>>}
     */
    rouletteStreets: rouletteSets.getStreets(),

    /**
     * @type {Array<Array<number>>}
     */
    rouletteCorners: rouletteSets.getCorners(),

    /**
     * @type {Array<Array<number>>}
     */
    rouletteDoubleStreets: rouletteSets.getDoubleStreets(),

    /**
     * @type {Array<Array<number>>}
     */
    rouletteTrios: [[0, 1, 2], [0, 2, 3]],

    /**
     * @type {Array<number>}
     */
    rouletteFirstFour: [0, 1, 2, 3],

    /**
     * @type {Array<number>}
     */
    rouletteWheel: [
        0, 32, 13, 19, 4, 21, 2, 23, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
        0, 32, 13, 19, 4, 21, 2, 23, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ],

    /**
     * @type {Array<RouletteGame>}
     */
    rouletteGames: [],

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

    /**
     * @param {string} username
     * @returns {BlackjackLastBet}
     */
    getLastBlackjackBet: function (username) {
        var lastBet = this.blackjackLastBets.filter(function(lastBet) { return lastBet.username == username })
        if (lastBet.length == 1) {
            return lastBet[0].betAmount
        }

        return 0;
    },

    /**
     * @param {string} username
     * @param {number} betAmount
     */
    setLastBlackjackBet: function (username, betAmount) {
        var lastBet = this.blackjackLastBets.filter(function(lastBet) { return lastBet.username == username })
        if (lastBet.length == 1) {
            lastBet[0].betAmount = betAmount
        }
        else {
            this.blackjackLastBets.push({ username: username, betAmount: betAmount })
        }
    },

    /**
     * @param {string} username
     * @returns {RouletteGame}
     */
    getRouletteGame: function (username) {
        var game = this.rouletteGames.filter(function(game) { return game.username == username && !game.gameEnded })
        if (game.length == 0) {
            game.push({ username: username, gameEnded: false, bets: [] })
            this.rouletteGames.push(game[0])
        }

        return game[0]
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
                    if (gameState.players) {
                        self.players = gameState.players
                    }
                    else {
                        self.players = []
                    }
                    if (gameState.blackjackGames) {
                        self.blackjackGames = gameState.blackjackGames
                    }
                    else {
                        self.blackjackGames = []
                    }
                    if (gameState.blackjackLastBets) {
                        self.blackjackLastBets = gameState.blackjackLastBets
                    }
                    else {
                        self.blackjackLastBets = []
                    }
                    if (gameState.rouletteGames) {
                        self.rouletteGames = gameState.rouletteGames
                    }
                    else {
                        self.rouletteGames = []
                    }
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
                if (gameState.players) {
                    self.players = gameState.players
                }
                else {
                    self.players = []
                }
                if (gameState.blackjackGames) {
                    self.blackjackGames = gameState.blackjackGames
                }
                else {
                    self.blackjackGames = []
                }
                if (gameState.blackjackLastBets) {
                    self.blackjackLastBets = gameState.blackjackLastBets
                }
                else {
                    self.blackjackLastBets = []
                }
                if (gameState.rouletteGames) {
                    self.rouletteGames = gameState.rouletteGames
                }
                else {
                    self.rouletteGames = []
                }
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
