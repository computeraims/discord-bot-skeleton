const WebSocket = require('ws');

const { MessageEmbed } = require('discord.js')

module.exports = async (client) => {
    console.log('unturned loaded')
    const wss = new WebSocket.Server({ port: 8080 });

    const guild = await client.guilds.cache.get('614540245290975243')
    const streamChannel = await guild.channels.cache.find(channel => { return channel.name == 'gamestream' })

    wss.on('error', e => {
        console.log(e)
    })

    wss.on('connection', function connection(ws) {
        ws.on('message', function incoming(message) {
            message = JSON.parse(message)
            console.log(message)

            if (message.type == "PlayerConnected") {
                const exampleEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Player Connected')
                    .setAuthor(message.data.name, message.data.avatar, message.data.url)
                    .setTimestamp()

                streamChannel.send(exampleEmbed)
            }

            if (message.type == "PlayerDisconnected") {
                const exampleEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Player Disconnected')
                    .setAuthor(message.data.name, message.data.avatar, message.data.url)
                    .setTimestamp()

                streamChannel.send(exampleEmbed)
            }

            if (message.type == "PlayerChatted") {
                const exampleEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(message.data.message)
                    .setAuthor(message.data.name, message.data.avatar, message.data.url)
                    .setTimestamp()

                streamChannel.send(exampleEmbed)
            }

            if (message.type == "PlayerDamaged") {
                const exampleEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(message.data.message)
                    .setAuthor(message.data.name, message.data.avatar, message.data.url)
                    .setTimestamp()

                streamChannel.send(exampleEmbed)
            }
        });
    });
}