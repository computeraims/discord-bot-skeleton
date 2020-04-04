const fs = require('fs')
const Discord = require('discord.js')
const { prefix, token } = require('./config.json')
let config = require('./config.json')

const client = new Discord.Client()
client.commands = new Discord.Collection()

const permissions = require('./permissions')

const commandCategories = fs.readdirSync('./commands')
for (const folder of commandCategories) {
	console.log(`Loading category ${folder}`)
	const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'))
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`)
		console.log(`	-> Loading command ${command.name}`);
		client.commands.set(command.name, command)
	}
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'))
for (const file of eventFiles) {
	const event = require(`./events/${file}`)
	const sanitized = file.split('.')[0]
	console.log(`Loading event ${sanitized}`)
	client.on(sanitized, event.bind(null, client));
}

client.levelCache = {};
for (let i = 0; i < permissions.length; i++) {
  const thisLevel = permissions[i];
  client.levelCache[thisLevel.name] = thisLevel.level;
}

client.login(token)
