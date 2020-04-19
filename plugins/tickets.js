const Keyv = require('keyv');
const keyv = new Keyv();

const { MessageEmbed } = require('discord.js');

module.exports = async (client) => {
    console.log('Hello from forms plugin!')
    // usage: !newform title,description,option,option,option,option,option
    client.addCommand({
        name: 'ticketbox',
        description: 'Create a new form.',
        level: 0,
        args: false,
        guildOnly: false,
        execute(message, args, level) {
            const embed = new MessageEmbed()
                .setTitle('Support Ticket')
                .setColor(0xff0000)
                .setDescription('To create a support ticket react with ✉️ once your ticket is created please describe your issue and a staff member will help you as soon as possible.');
            message.channel.send(embed)
                .then(async message => {
                    await message.react('✉️')
                    let ticket = {
                        "id": message.id
                    }

                    await keyv.set(`tickets`, ticket)
                    let testvalue = await keyv.get('tickets')

                    console.log(testvalue)
                })
        },
    })

    client.on('messageReactionAdd', async (reaction, user) => {
        // When we receive a reaction we check if the reaction is partial or not
        if (reaction.partial) {
            // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
            try {
                await reaction.fetch();
            } catch (error) {
                console.log('Something went wrong when fetching the message: ', error);
                // Return as `reaction.message.author` may be undefined/null
                return;
            }
        }
        // Now the message has been cached and is fully available
        console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`);
        // The reaction is now also fully available and the properties will be reflected accurately:
        console.log(`${reaction.count} user(s) have given the same reaction to this message!`);
    });


}