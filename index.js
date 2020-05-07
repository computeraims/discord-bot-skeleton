const fs = require('fs')
const Discord = require('discord.js')
const { token } = require('./config.json')
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })

client.once('ready', async () => {
	console.log('Connected to Discord')

	const pluginFolders = fs.readdirSync('./plugins').filter(i => { let stats = fs.statSync(`./plugins/${i}`); if (stats.isDirectory()) return true; })

	console.log(`Loading plugins...`)
	for (const folder of pluginFolders) {
		const pluginFiles = fs.readdirSync(`./plugins/${folder}`).filter(i => { { if (i.endsWith('.js')) return true } })
		console.log(`	-> Loading plugin ${folder}`)

		for (const file of pluginFiles) {
			const plugin = require(`./plugins/${folder}/${file}`)
			const sanitized = file.split('.')[0]
			console.log(`		-> Loading file ${file}`)
			let preRunEvents = client.eventNames()
			let preRunListeners = []
			for (const event of preRunEvents) {
				preRunListeners.push(client.listenerCount(event))
			}

			const runPlugin = plugin.bind(plugin, client)

			await runPlugin()

			let postRunEvents = client.eventNames()
			let postRunListeners = []
			for (const event of postRunEvents) {
				postRunListeners.push(client.listenerCount(event))
			}

			if (preRunEvents.length != postRunEvents.length) {
				for (let i = preRunEvents.length; i < postRunEvents.length; i++) {
					console.log(`			-> Loading event ${postRunEvents[i]}`)
				}
			}

			if (preRunListeners != postRunListeners) {
				for (let i = 0; i < preRunListeners.length; i++) {
					if (preRunListeners[i] != postRunListeners[i]) {
						console.log(`			-> Loading event ${preRunEvents[i]}`)
					}
				}
			}
		}
	}
	client.emit('pluginsLoaded')
	console.log('Client Ready!');
})

client.login(token)