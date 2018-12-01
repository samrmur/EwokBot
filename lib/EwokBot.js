const Discord = require('discord.js');
const Parser = require('./Parser.js').Parser;
const config = require('../config.json');

class EwokBot {
	constructor() {
		this.client = new Discord.Client();
		this.parser = new Parser();
	}
	
	init() {
		this.client.login(config.discordKey);

		this.client.on('ready', () => {
			console.log(`Logged in as ${this.client.user.tag}!`);
		});

		this.client.on('message', msg => {
			if (msg.content.startsWith("~"))
				this.parser.parseTextCommand(this.client, msg.member, msg.channel, msg.content.substring(1));
		});
	}
}

module.exports.EwokBot = EwokBot;