var discord = require('discord.js')
var client = new discord.Client()

var f = require('./functions')
var db = require('./db').db

client.on('ready', function() {
    console.log('system initialised')
    db.load()
})

client.on('message', function(message) {
    if (message == '!version') {
        message.channel.send('v0.1.2')
    }

    if (message == '!help') {
        message.author.send(db.help)
    }

    if (message == '!just') {
        message.channel.send('Monika.')
    }

    if (message == '!anxiety') {
        message.author.send('Don\'t worry, I\'ll always love you.')
    }

    var content = message.content
    var username = message.author.username
    if (content.slice(0, 1) == '!') {
        var args = content.split(' ')
        if (args[0] == '!reset') {
            var player = db.getPlayer(username)
            player.credits = 10000
            message.channel.send('You have restarted the game with ' + player.credits + ' credits')
        }

        if (args[0] == '!credits') {
            var credits = f.getCredits(username)
            message.channel.send('You have ' + credits + ' credits')
        }

        if (args[0] == '!dice') {
            var diceResult = f.dice(username, +args[1], +args[2])
            var userMessage = ''
            if (diceResult.error) {
                userMessage = 'Error! ' + diceResult.error
            }
            else {
                userMessage = diceResult.message
            }

            message.channel.send(userMessage)
        }

        if (args[0] == '!blackjack' || args[0] == '!21') {
            var betAmount = 0
            if (args.length == 2) {
                betAmount = +args[1]
            }
            else {
                betAmount = db.getLastBlackjackBet(username)
            }

            if (betAmount == 0) {
                message.channel.send('You need to enter a bet amount')
            }
            else {
                var startBlackjackResult = f.startBlackjack(username, betAmount)
                if (startBlackjackResult.error) {
                    message.channel.send('Error! ' + startBlackjackResult.error)
                }
                else {
                    var game = db.getBlackjackGame(username)
                    message.channel.send(
                        ['Dealer\'s hand:\n']
                        .concat([
                            message.guild.emojis.get(
                                db.cardEmojis[startBlackjackResult.monikaHand[0]]
                            )
                            .toString()
                        ])
                        .concat([
                            message.guild.emojis.get(
                                db.cardEmojis['cardback']
                            )
                            .toString()
                        ])
                        .concat(['\n' + username + '\'s hand:\n'])
                        .concat(
                            startBlackjackResult.playerHand.map(function(cardName) {
                                var id = db.cardEmojis[cardName]
                                return message.guild.emojis.get(id).toString()
                            })
                        )
                        .concat(['\n' + startBlackjackResult.message])
                        .join('')
                    )
                    .then(function(message) {
                        game.handMessageId = message.id
                    })
                }
            }
        }

        if (args[0] == '!hit' || args[0] == '!h') {
            var blackjackHitResult = f.playerHitBlackjack(username)
            if (blackjackHitResult.error) {
                message.channel.send('Error! ' + blackjackHitResult.error)
            }
            else {
                message.channel.messages.get(blackjackHitResult.handMessageId).edit(
                    ['Dealer\'s hand:\n']
                    .concat([
                        message.guild.emojis.get(
                            db.cardEmojis[blackjackHitResult.monikaHand[0]]
                        )
                        .toString()
                    ])
                    .concat([
                        message.guild.emojis.get(
                            db.cardEmojis['cardback']
                        )
                        .toString()
                    ])
                    .concat(['\n' + username + '\'s hand:\n'])
                    .concat(
                        blackjackHitResult.playerHand.map(function(cardName) {
                            var id = db.cardEmojis[cardName]
                            return message.guild.emojis.get(id).toString()
                        })
                    )
                    .concat(['\n' + blackjackHitResult.message])
                    .join('')
                )
            }
        }

        if (args[0] == '!sit' || args[0] == '!s') {
            var blackjackSitResult = f.playerSitBlackjack(username)
            if (blackjackSitResult.error) {
                message.channel.send('Error! ' + blackjackSitResult.error)
            }
            else {
                var handMessage = message.channel.messages.get(blackjackSitResult.handMessageId)
                // Start at one to have the hidden card flipped
                var remainingMonikaCards = blackjackSitResult.monikaHand.slice(1)
                var listedMonikaCards = [blackjackSitResult.monikaHand[0]]
                for (var i = 1; i <= remainingMonikaCards.length; i++) {
                    setTimeout(function() {
                        listedMonikaCards.push(remainingMonikaCards.shift())
                        handMessage.edit(
                            ['Dealer\'s hand:\n']
                            .concat(
                                listedMonikaCards.map(function(cardName) {
                                    var id = db.cardEmojis[cardName]
                                    return message.guild.emojis.get(id).toString()
                                })
                            )
                            .concat(['\n' + username + '\'s hand:\n'])
                            .concat(
                                blackjackSitResult.playerHand.map(function(cardName) {
                                    var id = db.cardEmojis[cardName]
                                    return message.guild.emojis.get(id).toString()
                                })
                            )
                            .join('')
                        )
                    },
                    1000 * i)
                }

                setTimeout(function() {
                    message.channel.send(blackjackSitResult.message)
                },
                (remainingMonikaCards.length * 1000) + 500)
            }
        }

        if (args[0] == '!roulette' || args[0] == '!r') {
            var rouletteBetResult = f.rouletteBet(username, args.slice(1))
            if (rouletteBetResult.error) {
                message.channel.send('Error! ' + rouletteBetResult.error)
            }
            else {
                message.channel.send(rouletteBetResult.message)
            }
        }

        if (args[0] == '!spin') {
            var rouletteSpinResult = f.rouletteSpin(username)
            if (rouletteSpinResult.error) {
                message.channel.send(rouletteSpinResult.error)
            }
            else {
                var numbersSpinLength = rouletteSpinResult.numbersSpun.length
                message.channel.send(rouletteSpinResult.numbersSpun.pop())
                .then(function(spinMessage) {
                    for (var i = 1; i < numbersSpinLength; i++) {
                        setTimeout(
                            function() {
                                spinMessage.edit(rouletteSpinResult.numbersSpun.pop())
                            },
                            i * 500
                        )
                    }

                    setTimeout(
                        function() {
                            message.channel.send(rouletteSpinResult.message)
                        },
                        numbersSpinLength * 500 + 1000
                    )
                })
            }
        }

        if (args[0] == '!debug' && username == 'XDA-7') {
            if (args[1] == 'db') {
                message.channel.send(JSON.stringify(db))
            }
            else if (args[1] == 'emoji') {
                var emoji = message.guild.emojis.filterArray(function (emoji) {
                    return emoji.name == args[2]
                })
                if (emoji.length == 1) {
                    message.channel.send(emoji[0].toString())
                }
                else {
                    message.channel.send('Not found')
                }
            }
            else if (args[1] == 'listemojis') {
                if (args[2] == 'ids') {
                    message.channel.send(message.guild.emojis.map(function(emoji, key) {
                        return JSON.stringify({ key: key, name: emoji.name })
                    }))
                }
                else if (args[2] == 'images') {
                    message.channel.send(
                        message.guild.emojis.get(db.cardEmojis.redace).toString() +
                        message.guild.emojis.get(db.cardEmojis.redtwo).toString() +
                        message.guild.emojis.get(db.cardEmojis.redthree).toString() +
                        message.guild.emojis.get(db.cardEmojis.redfour).toString() +
                        message.guild.emojis.get(db.cardEmojis.redfive).toString() +
                        message.guild.emojis.get(db.cardEmojis.redsix).toString() +
                        message.guild.emojis.get(db.cardEmojis.redseven).toString() +
                        message.guild.emojis.get(db.cardEmojis.redeight).toString() +
                        message.guild.emojis.get(db.cardEmojis.rednine).toString() +
                        message.guild.emojis.get(db.cardEmojis.redten).toString() +
                        message.guild.emojis.get(db.cardEmojis.redjack).toString() +
                        message.guild.emojis.get(db.cardEmojis.redqueen).toString() +
                        message.guild.emojis.get(db.cardEmojis.redking).toString() +
                        message.guild.emojis.get(db.cardEmojis.blackace).toString() +
                        message.guild.emojis.get(db.cardEmojis.blacktwo).toString() +
                        message.guild.emojis.get(db.cardEmojis.blackthree).toString() +
                        message.guild.emojis.get(db.cardEmojis.blackfour).toString() +
                        message.guild.emojis.get(db.cardEmojis.blackfive).toString() +
                        message.guild.emojis.get(db.cardEmojis.blacksix).toString() +
                        message.guild.emojis.get(db.cardEmojis.blackseven).toString() +
                        message.guild.emojis.get(db.cardEmojis.blackeight).toString() +
                        message.guild.emojis.get(db.cardEmojis.blacknine).toString() +
                        message.guild.emojis.get(db.cardEmojis.blackten).toString() +
                        message.guild.emojis.get(db.cardEmojis.blackjack).toString() +
                        message.guild.emojis.get(db.cardEmojis.blackqueen).toString() +
                        message.guild.emojis.get(db.cardEmojis.blackking).toString()
                    )
                }
            }
            else if (args[1] == 'reset') {
                db.reset()
                message.channel.send('Done')
            }
            else if (args[1] == 'resetblackjack') {
                db.blackjackGames = []
                message.channel.send('Done')
            }
            else if (args[1] == 'bjhandvalue') {
                message.channel.send(f.blackjackHandValue(args.slice(2).map(function(value) {
                    return { value: +value }
                })))
            }
            else if (args[1] == 'betSquares') {
                var betSquaresResult = f.getBetSquares(args.slice(2))
                message.channel.send(betSquaresResult.isValid)
                message.channel.send(betSquaresResult.result)
            }
            else if (args[1] == 'edit') {
                var lastMessage = message.channel.messages.array()
                .filter(function(message) {
                    return message.author.username == 'Monika'
                })
                .sort(function(a, b) {
                    return a.createdTimestamp > b.createdTimestamp
                })
                if (lastMessage.length > 0) {
                    lastMessage[0].edit(args[2])
                }
                else {
                    message.channel.send('I haven\'t sent a message since last restart')
                }
            }
            else if (args[1] == 'splits') {
                message.channel.send(db.rouletteSplits)
            }
            else if (args[1] == 'street') {
                message.channel.send(db.rouletteStreets)
            }
            else if (args[1] == 'corner') {
                message.channel.send(db.rouletteCorners)
            }
            else if (args[1] == 'doublestreet') {
                message.channel.send(db.rouletteDoubleStreets)
            }
            else if (args[1] == 'roulettegames') {
                message.channel.send(JSON.stringify(db.rouletteGames))
            }
        }
        else if (args[0] == '!debug') {
            message.channel.send('No! Bad ' + username + '! Bad!')
        }

        db.save()
    }
})

client.login(process.env.TOKEN)