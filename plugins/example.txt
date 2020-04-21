module.exports = async (client) => {
    console.log('Hello from example plugin!')

    client.addCommand({
        name: 'example',
        description: 'Example!',
        level: 0,
        args: false,
        guildOnly: false,
        execute(message, args, level) {
            message.channel.send('Example.');
        },
    })

    client.on("ready", () => {
        console.log('Ready event triggered from example plugin!')
    })
}