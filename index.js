const fs = require('fs')
const Discord = require('discord.js')
const { prefix, token } = require('./config.json')
let config = require('./config.json')

const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })
client.commands = new Discord.Collection()

const permissions = require('./permissions')

// This function allows us to add commands from plugins.
client.addCommand = (command) => {
	console.log(`		-> Loading command ${command.name}`)
	client.commands.set(command.name, command)
}

const commandCategories = fs.readdirSync('./commands')
console.log(`Loading commands...`)
for (const folder of commandCategories) {
	console.log(`	-> Loading category ${folder}`)
	const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'))
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`)
		console.log(`		-> Loading command ${command.name}`);
		client.commands.set(command.name, command)
	}
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'))
console.log(`Loading events...`)
for (const file of eventFiles) {
	const event = require(`./events/${file}`)
	const sanitized = file.split('.')[0]
	console.log(`	-> Loading event ${sanitized}`)
	client.on(sanitized, event.bind(null, client));
}

const pluginFiles = fs.readdirSync('./plugins').filter(file => file.endsWith('.js'))
console.log(`Loading plugins...`)
for (const file of pluginFiles) {
	const plugin = require(`./plugins/${file}`)
	const sanitized = file.split('.')[0]
	const runPlugin = plugin.bind(null, client)
	console.log(`	-> Loading plugin ${sanitized}`)

	let preRunEvents = client.eventNames()
	let preRunListeners = []
	for (const event of preRunEvents) {
		preRunListeners.push(client.listenerCount(event))
	}
	runPlugin()
	let postRunEvents = client.eventNames()
	let postRunListeners = []
	for (const event of postRunEvents) {
		postRunListeners.push(client.listenerCount(event))
	}
	if (preRunEvents != postRunEvents) console.log(`		-> Loading event ${postRunEvents[postRunEvents.length - 1]}`)
	if (preRunListeners != postRunListeners) {
		for (let i = 0; i < preRunListeners.length; i++) {
			if (preRunListeners[i] != postRunListeners[i]) {
				console.log(`		-> Loading event ${preRunEvents[i]}`)
			}
		}
	}
}

client.levelCache = {};
for (let i = 0; i < permissions.length; i++) {
	const thisLevel = permissions[i];
	client.levelCache[thisLevel.name] = thisLevel.level;
}

client.login(token)
