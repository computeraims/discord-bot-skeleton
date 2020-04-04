const permissions = require('../../permissions')
module.exports = {
    name: 'auth',
    description: 'Check your permission level.',
    level: 0,
    args: false,
    guildOnly: false,
    execute(message, args, level) {
        console.log(level)
        const friendly = permissions.find(l => l.level === level).name;
        message.channel.send(`<${level}:${friendly}>`);
    },
};
