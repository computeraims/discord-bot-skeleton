module.exports = async (client) => {
    const db = new (require('../../db'))('stickyMessages')
    await db.ensureTable()

    client.addCommand({
        name: 'stick',
        description: 'Stick a message.',
        permissions: ['ADMINISTRATOR'],
        args: true,
        guildOnly: true,
        async execute(message, args) {
            let dbMessage = await db.get(message.channel.id)
            if (dbMessage) {
                let channelMessage = await message.channel.messages.fetch(dbMessage.id)
                if (!channelMessage) return
                await channelMessage.delete()
                await db.delete(message.channel.id)
            }

            args = args.join(' ')

            let msg = await message.channel.send(args)
            await db.set(msg.channel.id, {
                id: msg.id,
                content: args
            })

            await message.delete()

        },
    })

    client.addCommand({
        name: 'unstick',
        description: 'Unstick the stuck message.',
        permissions: ['ADMINISTRATOR'],
        args: false,
        guildOnly: true,
        async execute(message, args) {
            let dbMessage = await db.get(message.channel.id)
            if (!dbMessage) return
            let channelMessage = await message.channel.messages.fetch(dbMessage.id)
            if (!channelMessage) return
            await channelMessage.delete()
            await db.delete(message.channel.id)
        },
    })

    client.on('message', async (message) => {
        let guildSettings = await client.guildSettings.get(message.guild.id)
        if (message.author.bot || message.content.startsWith(guildSettings.prefix)) return

        let dbMessage = await db.get(message.channel.id)
        if (!dbMessage) return

        let cachedMessage = await message.channel.messages.fetch(dbMessage.id)
        if (!cachedMessage) return

        await cachedMessage.delete()

        let newMessage = await message.channel.send(dbMessage.content)
        if (!newMessage) return

        dbMessage.id = newMessage.id
        await db.set(message.channel.id, dbMessage)
    })
}