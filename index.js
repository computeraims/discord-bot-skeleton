const fs = require('fs')
const Discord = require('discord.js')
const { token } = require('./config.json')

const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })

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

	if (preRunEvents.length != postRunEvents.length) {
		for (let i = preRunEvents.length; i < postRunEvents.length; i++) {
			console.log(`		-> Loading event ${postRunEvents[i]}`)
		}
	}

	if (preRunListeners != postRunListeners) {
		for (let i = 0; i < preRunListeners.length; i++) {
			if (preRunListeners[i] != postRunListeners[i]) {
				console.log(`		-> Loading event ${preRunEvents[i]}`)
			}
		}
	}
}

client.login(token)
