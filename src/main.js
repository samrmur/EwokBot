const Discord = require('discord.js');
const CommandParser = require('./parser.js');
const client = new Discord.Client();

client.login("NDE4MDkwMjg5NTY4MTUzNjEw.DsUiVQ.v31qxhCtMx3zvXfdZoJF8ojUuKk");

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
	if (msg.content.startsWith("~"))
		CommandParser.parseCommand(client, msg.member, msg.channel, msg.content.substring(1));
});

