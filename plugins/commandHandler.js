const permissions = require('../permissions')
const { prefix } = require('../config.json')
const { Collection } = require('discord.js');


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

module.exports = async (client) => {
    client.commands = new Collection()
    client.commands.cooldowns = new Collection();

    client.levelCache = {};
    for (let i = 0; i < permissions.length; i++) {
        const thisLevel = permissions[i];
        client.levelCache[thisLevel.name] = thisLevel.level;
    }

    // This function allows us to add commands from plugins.
    client.addCommand = (command) => {
        console.log(`		-> Loading command ${command.name}`)
        client.commands.set(command.name, command)
    }

    client.on('message', message => {
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

        if (!client.commands.cooldowns.has(command.name)) {
            client.commands.cooldowns.set(command.name, new Collection());
        }

        const now = Date.now();
        const timestamps = client.commands.cooldowns.get(command.name);
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
            command.execute(message, args);
        } catch (error) {
            console.error(error);
            message.reply('there was an error trying to execute that command!');
        }
    })

    client.addCommand({
        name: 'ping',
        description: 'Ping!',
        level: 0,
        args: false,
        guildOnly: false,
        execute(message, args) {
            message.channel.send('Pong.');
        },
    })

    client.addCommand({
        name: 'permission',
        description: 'Check your permission level.',
        level: 0,
        args: false,
        guildOnly: false,
        execute(message, args) {
            const level = getPermLevel(message);
            const friendly = permissions.find(l => l.level === level).name;
            message.channel.send(`Your permission level is ${level} - ${friendly}`);
        },
    })
}