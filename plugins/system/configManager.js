module.exports = async client => {
    let defaultSettings = {
        prefix: "!",
    }

    client.guildSettings = new (require('../../db'))('guildSettings')
    // Ensures guild settings exist
    let guildsArr = client.guilds.cache.array()
    for (const guild of guildsArr) {
        await client.guildSettings.ensure(guild.id, defaultSettings)
        console.log(`Ensuring ${guild.name} in database.`)
        console.log(await client.guildSettings.get(guild.id))
    }

    client.guildSettings.addSetting = async (key, value) => {
        for (guild of guildsArr) {
            let guildSettings = await client.guildSettings.get(guild.id)
            if (!guildSettings[key]) {
                guildSettings[key] = value
                await client.guildSettings.set(guild.id, guildSettings)
                console.log(`			-> Generating setting ${key} as ${JSON.stringify(value)} for ${guild.name}`)
            }
        }
    }

    client.on('guildCreate', async guild => {
        await client.guildSettings.set(guild.id, defaultSettings)
        console.log(`Created default settings for ${guild.name}`)
    })

    client.on('guildDelete', async guild => {
        await client.guildSettings.delete(guild.id)
        console.log(`Deleted settings for ${guild.name}`)
    })

    client.addCommand({
        name: 'settings',
        description: 'Shows the guild settings.',
        aliases: ['config'],
        usage: '<set> <key> <value>',
        permissions: ['ADMINISTRATOR'],
        //level: 0,
        cooldown: 2,
        args: false,
        guildOnly: true,
        async execute(message, args) {
            if (!args.length) {
                let guildSettings = await client.guildSettings.get(message.guild.id)
                let data = []
                Object.keys(guildSettings).forEach(key => {
                    let value = guildSettings[key]
                    data.push(`**${key}**: ${JSON.stringify(value)}`)
                })
                return message.channel.send(data, { split: true })
            }
        },
    })
}