const config = require('../../config.json');

class Channel {
	constructor(speechToText, textToSpeech) {
		this.speechToText = speechToText;
		this.textToSpeech = textToSpeech;
	}
	
	play(client, member, channel, fileName) {
		if (fileName === null || fileName === undefined) {
			if (channel !== null) {
				channel.send(`${member.displayName}, please join a voice channel first!`)
					.then(message => console.log(`Sent message: ${message.content}`))
					.catch(console.error);
			} else {
				member.send(`${member.displayName}, the channel ${commandArgs[0]} does not exist!`)
					.then(message => console.log(`Sent message: ${message.content}`))
					.catch(console.error);
			}
		}
		
		let voiceConnection = client.voiceConnections.get(member.guild.id);
		
		if (voiceConnection === null || voiceConnection === undefined) {
			this.join(client, member, channel, null);
			voiceConnection = client.voiceConnections.get(member.guild.id);
		}

		voiceConnection.playFile(fileName);
	}
	
	join(client, member, channel, commandArgs) {
		if (commandArgs != null) {
			const voiceChannels = member.guild.channels.filter(channel => channel.type === "voice");
			const voiceChannel = voiceChannels.find(channel => channel.name.toLowerCase() === commandArgs[0].toLowerCase());
			
			if (voiceChannel === null) {
				if (channel !== null) {
					channel.send(`${member.displayName}, the channel ${commandArgs[0]} does not exist!`)
						.then(message => console.log(`Sent message: ${message.content}`))
						.catch(console.error);
				} else {
					const voiceConnection = member.guild.voiceConnection;
					
					if (voiceConnection === undefined) {
						member.send(`${member.displayName}, the channel ${commandArgs[0]} does not exist!`)
							.then(message => console.log(`Sent message: ${message.content}`))
							.catch(console.error);
					} else {
						this.textToSpeech.play(voiceConnection, `${member.displayName}, the channel ${commandArgs[0]} does not exist!`);
					}
				}
			} else {
				voiceChannel.join()
					.then(connection => {
						console.log(`Joined Channel: ${connection.channel.name}`);
						this.speechToText.listen(client, connection);
					})
					.catch(console.error);
			}
		} else {
			const voiceChannel = member.voiceChannel;
			
			if (voiceChannel === undefined) {
				if (channel !== null) {
					channel.send(`${member.displayName}, please join a voice channel first!`)
						.then(message => console.log(`Sent message: ${message.content}`))
						.catch(console.error);
				} else {
					const voiceConnection = member.guild.voiceConnection;
					
					if (voiceConnection === undefined) {
						member.send(`${member.displayName}, the channel ${commandArgs[0]} does not exist!`)
							.then(message => console.log(`Sent message: ${message.content}`))
							.catch(console.error);
					} else {
						this.textToSpeech.play(voiceConnection, `${member.displayName}, please join a voice channel first!`);
					}
				}
			} else {
				voiceChannel.join()
					.then(connection => {
						console.log(`Joined Channel: ${connection.channel.name}`);
						this.speechToText.listen(client, connection);
					})
					.catch(console.error);
			}
		}
	}
	
	leave(client, member, channel) {
		const voiceConnection = client.voiceConnections.get(member.guild.id);
		
		if (voiceConnection === undefined)
			channel.send(`${member.displayName}, I am not in any voice channels!`)
				.then(message => console.log(`Sent message: ${message.content}`))
				.catch(console.error);
		else {
			const voiceChannel = voiceConnection.channel;
			voiceChannel.leave();
			console.log(`Left Channel: ${voiceChannel.name}`);
		}
	}
}

module.exports.Channel = Channel;