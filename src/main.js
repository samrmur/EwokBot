const Discord = require('discord.js');
const CommandParser = require('./parser.js');
const client = new Discord.Client();
const config = require('../config.json');

client.login(config.discordKey);

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
	if (msg.content.startsWith("~"))
		CommandParser.parseCommand(client, msg.member, msg.channel, msg.content.substring(1));
});

