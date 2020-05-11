const fs = require('fs')
const Discord = require('discord.js')
const { token } = require('./config.json')
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })

client.once('ready', async () => {
	console.log('Connected to Discord')

	client.db = (table) => {
		return new (require('./db'))(table)
	}

	const pluginFolders = fs.readdirSync('./plugins').filter(i => { let stats = fs.statSync(`./plugins/${i}`); if (stats.isDirectory()) return true; })

	console.log(`Loading plugins...`)

	let plugins = []
	for (const folder of pluginFolders) {
		let pluginStructure = {
			name: folder,
			functions: []
		}
		const pluginFiles = fs.readdirSync(`./plugins/${folder}`).filter(i => { { if (i.endsWith('.js')) return true } })
		console.log(`	-> Loading plugin ${folder}`)

		for (const file of pluginFiles) {
			const plugin = require(`./plugins/${folder}/${file}`)
			const sanitized = file.split('.')[0]
			console.log(`		-> Loading file ${file}`)

			const runPlugin = plugin.bind(plugin, client)

			pluginStructure.functions.push(runPlugin)
		}
		plugins.push(pluginStructure)
	}
	var systemIndex = plugins.findIndex(element => { return element.name === 'system' })
	for (let func of plugins[systemIndex].functions) {
		await func()
		plugins.splice(systemIndex, 0)
	}

	for (let plugin of plugins) {
		for (let func of plugin.functions) {
			await func()
		}
	}

	console.log('Client Ready!');
})

client.login(token)