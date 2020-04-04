module.exports = {
	name: 'ping',
	description: 'Ping!',
	level: 0,
	args: false,
	guildOnly: false,
	execute(message, args, level) {
		message.channel.send('Pong.');
	},
};
