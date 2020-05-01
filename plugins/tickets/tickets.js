const { MessageEmbed, MessageAttachment } = require('discord.js');

module.exports = async (client) => {
	client.on('pluginsLoaded', async () => {
		await client.guildSettings.addSetting('ticketRoles', [])
	})

	client.addCommand({
		name: 'ticketbox',
		description: 'Create a new ticketbox.',
		permissions: ['ADMINISTRATOR'],
		args: false,
		guildOnly: false,
		execute(message, args) {
			const tickets = new (require('../../db'))(`tickets-${message.guild.id}`)
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

	client.addCommand({
		name: 'ticketroles',
		description: 'Manage ticket master roles.',
		usage: '<set/add>',
		permisisons: ['ADMINISTRATOR'],
		args: true,
		guildOnly: true,
		async execute(message, args) {
			if (args[0] == 'set') {
				let rolesArr = message.mentions.roles.array()
				if (!rolesArr.length) {
					message.channel.send('You need to mention the roles you want to have ticket view.')
				}

				let guildSettings = await client.guildSettings.get(message.guild.id)
				let idArr = []
				for (let role of rolesArr) {
					idArr.push(role.id)
				}

				guildSettings.ticketRoles = idArr

				await client.guildSettings.set(message.guild.id, guildSettings)
				message.channel.send(`Successfully set ticket master roles.`)
			} else if (args[0] == 'add') {
				let rolesArr = message.mentions.roles.array()
				if (!rolesArr.length) {
					message.channel.send('You need to mention the roles you want to have ticket view.')
				}

				let guildSettings = await client.guildSettings.get(message.guild.id)

				for (let role of rolesArr) {
					guildSettings.ticketRoles.push(role.id)
				}

				await client.guildSettings.set(message.guild.id, guildSettings)
				message.channel.send(`Successfully added ticket master roles.`)
			} else {
				message.channel.send('Invalid syntax');
			}
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

		// Check if we should open a ticket
		if (reaction.message.channel.type == 'text' && reaction.emoji.name == '✉️') {
			const tickets = new (require('../../db'))(`tickets-${reaction.message.guild.id}`)
			let handlerMessage = await tickets.get('handler')
			if (handlerMessage != reaction.message.id) return;
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

			let settings = await client.guildSettings.get(guild.id)

			let permissions = []
			for (let role of settings.ticketRoles) {
				permissions.push({
					id: role,
					allow: ['VIEW_CHANNEL']
				},
					{
						id: guild.roles.everyone,
						deny: ['VIEW_CHANNEL']
					})
			}

			guild.channels.create(`Creating ticket...`, {
				type: 'text',
				parent: category,
				permissionOverwrites: permissions
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
			let tickets = new (require('../../db'))(`tickets-${reaction.message.guild.id}`)
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
							.setDescription(`Your ticket was closed by ${user.username}. Clicking the button below will allow you to view a transcript of the conversation.`)
							.addField('Guild', reaction.message.guild.id)
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
			let guildId = reaction.message.embeds[0].fields[0].value
			let tickets = new (require('../../db'))(`tickets-${guildId}`)
			let ticketId = reaction.message.embeds[0].title.slice(7)
			let ticket = await tickets.get(ticketId)

			joined = ticket.transcript.join('\n')
			const att = new MessageAttachment(Buffer.from(joined), 'transcript.txt');
			reaction.message.channel.send(att);
		}
	});

	client.on('message', async (message) => {
		if (message.channel.type == 'text' && message.channel.name.startsWith('ticket-')) {
			const tickets = new (require('../../db'))(`tickets-${message.guild.id}`)
			console.log(tickets)
			let ticket = await tickets.get(message.channel.name.slice(7))
			ticket.transcript.push(`${message.author.username} (${message.author.id}): ${message.content}`)
			await tickets.set(message.channel.id, ticket);
		}
	})
}