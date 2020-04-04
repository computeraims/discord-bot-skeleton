const config = require('./config.json')

let permissions = [
    {
        level: 0,
        name: "user",
        check: () => true
    },
    {
        level: 1,
        name: "moderator",
        check: (message) => {
            try {
                const guild = message.client.guilds.cache.get(config.guild)
                const member = guild.members.cache.get(message.author.id);
                let role = guild.roles.cache.find(role => role.name === config.roles.moderator);
                if (member.roles.cache.has(role.id)) return true
            } catch (e) {
                return false;
            }
        }
    },
    {
        level: 1337,
        name: "owner",
        check: (message) => {
            try {  
                const guild = message.client.guilds.cache.get(config.guild)
                const member = guild.members.cache.get(message.author.id);
                let role = guild.roles.cache.find(role => role.name === config.roles.owner);
                if (member.roles.cache.has(role.id)) return true
            } catch (e) {
                return false;
            }
        }
    },
]

module.exports = permissions