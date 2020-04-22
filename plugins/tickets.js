const tickets = new (require('../db'))('tickets')
const { MessageEmbed, MessageAttachment } = require('discord.js');

module.exports = async (client) => {
    client.addCommand({
        name: 'ticketbox',
        description: 'Create a new ticketbox.',
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
                    await tickets.set('handler', message.id)
                })
        },
    })

    client.on('messageReactionAdd', async (reaction, user) => {
        if (user.bot) return;
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

        let handlerMessage = await tickets.get('handler')
        // Check if we should open a ticket
        if (handlerMessage == reaction.message.id && reaction.emoji.name == '✉️') {
            await reaction.users.remove(user.id)
            let guild = reaction.message.guild
            let category = reaction.message.guild.channels.cache.find(category => category.name === 'Tickets')

            if (!category) {
                await guild.channels.create(`Tickets`, {
                    type: 'category',
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone,
                            deny: ['VIEW_CHANNEL']
                        }
                    ],
                })
            }

            guild.channels.create(`Creating ticket...`, {
                type: 'text',
                parent: category,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        deny: ['VIEW_CHANNEL']
                    },
                    {
                        id: user.id,
                        allow: ['VIEW_CHANNEL'],
                    },
                ],
            })
                .then(async channel => {
                    let ticket = {
                        openedBy: user.id,
                        closedBy: null,
                        openedAt: Date.now(),
                        closedAt: null,
                        transcript: []
                    }
                    await tickets.set(channel.id, ticket)
                    await channel.setName(`ticket-${channel.id}`)
                    const embed = new MessageEmbed()
                        .setTitle(`Ticket ${channel.id}`)
                        .setColor(0xff0000)
                        .setDescription('Please describe your issue in detail and a staff member will reply as soon as possible. Thank you!');
                    channel.send(embed)
                        .then(async message => {
                            await message.react('🔒')
                        })
                })
        }

        if (reaction.message.channel.type == 'text' && reaction.message.channel.name.startsWith('ticket-') && reaction.emoji.name == '🔒') {
            let ticket = await tickets.get(reaction.message.channel.id)
            ticket.closedBy = user.id
            ticket.closedAt = Date.now();
            await tickets.set(reaction.message.channel.id, ticket)
            reaction.message.channel.delete()
                .then(async () => {
                    let opener = await reaction.message.guild.members.fetch(ticket.openedBy)
                    try {
                        const embed = new MessageEmbed()
                            .setTitle(`Ticket ${reaction.message.channel.id}`)
                            .setColor(0xff0000)
                            .setDescription(`Your ticket was closed by ${user.username}. Clicking the button below will allow you to view a transcript of the conversation.`);
                        opener.send(embed)
                            .then(async message => {
                                await message.react('📜')
                            })
                    }
                    catch (error) {
                        if (error) return;
                    }
                })
        }

        if (reaction.message.channel.type == 'dm' && reaction.emoji.name == '📜') {
            let ticketId = reaction.message.embeds[0].title.slice(7)
            let ticket = await tickets.get(ticketId)

            joined = ticket.transcript.join('\n')
            const att = new MessageAttachment(Buffer.from(joined), 'transcript.txt');
            reaction.message.channel.send(att);
        }
    });

    client.on('message', async (message) => {
        if (message.channel.type == 'text' && message.channel.name.startsWith('ticket-')) {
            let ticket = await tickets.get(message.channel.name.slice(7))
            ticket.transcript.push(`${message.author.username} (${message.author.id}): ${message.content}`)
            await tickets.set(message.channel.id, ticket);
        }
    })
}