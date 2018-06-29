var discord = require('discord.js')
var client = new discord.Client()

var f = require('./functions')
var db = require('./db').db

client.on('ready', function() {
    console.log('system initialised')
    db.load()
})

client.on('message', function(message) {
    if (message == '!just') {
        message.channel.send('Monika.')
    }

    if (message == '!anxiety') {
        message.channel.send('Don\'t worry, I\'ll always love you.')
    }

    var content = message.content
    var username = message.author.username
    if (content.slice(0, 1) == '!') {
        var args = content.split(' ')
        if (args[0] == '!start') {
            if (args[1] == 'as') {
                username = args[2]
            }

            f.start(username)
            message.channel.send(username + ' has joined the game with ' + f.getCredits(username) + ' credits')
        }

        if (args[0] == '!credits') {
            var credits = f.getCredits(username)
            if (credits == -1) {
                message.channel.send('Player not found. To start playing, enter !start')
            }
            else {
                message.channel.send('You have ' + credits + ' credits')
            }
        }

        if (args[0] == '!dice') {
            var result = f.dice(username, Number.parseInt(args[1]), Number.parseInt(args[2]))
            var userMessage = ''
            if (result.error) {
                userMessage = 'Error! ' + result.error
            }
            else {
                userMessage = result.message
            }

            message.channel.send(userMessage)
        }

        if (args[0] == '!debug') {
            if (args[1] == 'db') {
                message.channel.send(JSON.stringify(db))
            }
        }

        db.save()
    }
})

client.login('NDYyMjAwMTM2ODQ4NjM3OTcy.DheZSg.llnB8faEVbkiWoAgFjfqzT0vwAY')