var fs = require('fs')

/**
 * @typedef {Object} Player
 * @property {string} name
 * @property {number} credits
 */

/**
 * @namespace
 */
module.exports.db = {
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

    /**
     * @param {string} username
     * @returns {Player}
     */
    getPlayer: function (username) {
        var player = this.players.filter(function(player) { return player.name == username })
        if (player.length == 1) {
            return player[0]
        }
        else {
            return undefined
        }
    },

    load: function() {
        var self = this
        fs.readFile('db.json', function(err, data) {
            if (err) {
                console.log(err)
            }
            else {
                self.players = JSON.parse(data).players
            }
        })
    },

    save: function() {
        fs.writeFile('db.json', JSON.stringify(this), function(err) {
            if (err) {
                console.log(err)
            }
        })
    }
}
