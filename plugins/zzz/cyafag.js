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
	let db = new (require('../../db'))('roles')

	client.on('guildMemberAdd', async (member) => {
		let dbMember = await db.get(member.user.id)
		for (let roleName of Object.keys(dbMember)) {
			let roleArr = member.guild.roles.cache.array()

			for (let role of roleArr) {
				if (role.name == roleName) {
					console.log(role)
					await member.roles.add(role)
						.catch(() => console.log('FUck shit'))
				}
			}
		}
	})
}