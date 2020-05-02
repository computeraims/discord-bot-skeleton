const { globalPrefix } = require('../../config.json')
const { Collection } = require('discord.js');
const path = require('path')

function getPermLevel(message) {
	let permlvl = 0;

	const permOrder = permissions.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);

	while (permOrder.length) {
		const currentLevel = permOrder.shift();
		if (currentLevel.check(message)) {
			permlvl = currentLevel.level;
			break;
		}
	}
	return permlvl;
}

function getCallFile() {
	var orig = Error.prepareStackTrace;
	Error.prepareStackTrace = function (_, stack) {
		return stack;
	};
	var err = new Error;
	Error.captureStackTrace(err, arguments.callee);
	var stack = err.stack;
	Error.prepareStackTrace = orig;
	return stack[1].getFileName()
}

module.exports = async (client) => {
	client.commands = new Collection()
	client.cooldowns = new Collection();

	// This function allows us to add commands from plugins.
	client.addCommand = (command) => {
		command.plugin = (path.basename(getCallFile(), '.js'))
		console.log(`			-> Loading command ${command.name}`)
		client.commands.set(command.name, command)
	}

	client.on('message', async message => {
		let prefix
		if (message.channel.type == 'dm') {
			prefix = globalPrefix
		}

		if (message.channel.type == 'text') {
			let guildSettings = await client.guildSettings.get(message.guild.id)
			prefix = guildSettings.prefix
		}

		if (!message.content.startsWith(prefix) && !message.content.startsWith(globalPrefix) || message.author.bot) return;

		const args = message.content.slice(prefix.length).split(/ +/);
		const commandName = args.shift().toLowerCase();

		const command = client.commands.get(commandName)
			|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) return;

		if (message.channel.type == 'text' && command.permissions && !message.member.hasPermission(command.permissions)) return

		if (command.guildOnly && message.channel.type !== 'text') {
			return message.reply('I can\'t execute that command inside DMs!');
		}

		if (command.args && !args.length) {
			let reply = `You didn't provide any arguments, ${message.author}!`;

			if (command.usage) {
				reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
			}

			return message.channel.send(reply);
		}

		if (!client.cooldowns.has(command.name)) {
			client.cooldowns.set(command.name, new Collection());
		}

		const now = Date.now();
		const timestamps = client.cooldowns.get(command.name);
		const cooldownAmount = (command.cooldown || 3) * 1000;

		if (timestamps.has(message.author.id)) {
			const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
			}
		}

		timestamps.set(message.author.id, now);
		setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

		try {
			command.execute(message, args);
		} catch (error) {
			console.error(error);
			message.reply('there was an error trying to execute that command!');
		}
	})

	client.addCommand({
		name: 'help',
		description: 'List all commands or info about a specified command.',
		aliases: ['command', 'commands'],
		usage: '[command]',
		permissions: [],
		//level: 0,
		cooldown: 2,
		args: false,
		guildOnly: false,
		execute(message, args) {
			const data = []
			if (!args.length) {
				data.push('Here\'s a list of all my commands:');
				client.commands.forEach(command => { data.push(`\n**${command.plugin}**`); data.push(command.name) })
				data.push(`\nYou can send \`${globalPrefix}help [command name]\` to get info on a specific command!\nGlobal Prefix: ${globalPrefix}\n[] = optional parameters\n<> = required parameters`);
				let filtered = data.filter((v, i) => data.indexOf(v) === i)
				return message.channel.send(filtered, { split: true })
			}

			const name = args[0].toLowerCase();
			const command = client.commands.get(name) || client.commands.find(c => c.aliases && c.aliases.includes(name));

			if (!command) {
				return
			}

			data.push(`**Name:** ${command.name}`);
			data.push(`**Description:** ${command.description || 'No description'}`);
			data.push(`**Aliases:** ${command.aliases ? command.aliases.join(', ') : 'No aliases'}`);
			data.push(`**Usage:** ${globalPrefix}${command.name} ${command.usage || ''}`);
			data.push(`**Permission:** ${JSON.stringify(command.permissions) || JSON.stringify([])}`)
			//data.push(`**Level:** ${command.level || 0}`)
			data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);
			data.push(`**Arguments:** ${command.args ? 'Yes' : 'No'}`)
			data.push(`**Guild Only:** ${command.guildOnly ? 'Yes' : 'No'}`)

			message.channel.send(data, { split: true });
		},
	})

	client.addCommand({
		name: 'ping',
		description: 'Ping!',
		permissions: [],
		args: false,
		guildOnly: false,
		execute(message, args) {
			message.channel.send('Pong.');
		},
	})

	client.addCommand({
		name: 'prefix',
		description: 'Ping!',
		//level: 0,
		permissions: ['ADMINISTRATOR'],
		args: false,
		guildOnly: false,
		async execute(message, args) {
			if (message.channel.type == 'dm') {
				return message.channel.send(`**Global Prefix:** ${globalPrefix}`)
			}

			if (!args.length) {
				let guildSettings = await client.guildSettings.get(message.guild.id)
				message.channel.send(`**Prefix:** ${guildSettings.prefix}`)
			}

			if (args[0] == 'set' && args[1]) {
				if (args[1].length > 1) return message.channel.send('Prefix may only be 1 character.')
				let guildSettings = await client.guildSettings.get(message.guild.id)
				guildSettings.prefix = args[1]
				await client.guildSettings.set(message.guild.id, guildSettings)
				message.channel.send(`Set prefix to ${guildSettings.prefix}`)
			}
		},
	})
}