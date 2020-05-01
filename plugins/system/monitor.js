module.exports = async client => {
    client.on('error', (error) => {
        console.log(`Discord Error: ${error}`)
    })

    client.on('guildUnavailable', (guild) => {
        console.log(`Discord Error: ${guild.name} is unreachable, likely due to outage`)
    })

    client.on('invalidated', () => {
        console.log(`Discord Error: Client session has become invalidated`)
        client.destroy()
    })

    client.on('rateLimit', () => {
        console.log(`Discord Error: Client is being rate limited`)
    })

    client.on('warn', (info) => {
        console.log(`Discord Warning: ${info}`)
    })
}