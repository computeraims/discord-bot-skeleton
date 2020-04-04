const Discord = require('discord.js');
const cooldowns = new Discord.Collection();
const { prefix } = require('../config.json')
const permissions = require('../permissions')

function getPermLevel(message) {
	let permlvl = 0;

	const permOrder = permissions.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);

	while (permOrder.length) {
		const currentLevel = permOrder.shift();
		if (currentLevel.check(message)) {
			console.log(currentLevel)
			permlvl = currentLevel.level;
			break;
		}
	}
	return permlvl;
}

module.exports = async (client, message) => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) return;

	const level = getPermLevel(message);

    if (level < command.level) {
        return console.log(`<${message.author.id}|${message.author.username}#${message.author.discriminator}> tried to executed command ${command.name}`)
    }

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

	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
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
		command.execute(message, args, level);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
}