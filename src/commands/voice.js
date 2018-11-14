const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;
const WitSpeech = require('node-witai-speech');
const fs = require('fs');
const config = require('../../config.json');

const models = new Models();

models.add({
    file: 'resources/ewok.pmdl',
    sensitivity: '0.5',
    hotwords: 'ewok'
});

const detector = new Detector({
    resource: "node_modules/snowboy/resources/common.res",
    models: models,
    audioGain: 1.0
});

const API_KEY = config.witKey;
const CONTENT_TYPE = "audio/raw;encoding=signed-integer;bits=32;rate=44000;endian=little";
 
function join(client, member, channel, commandArgs) {
	if (commandArgs != null) {
		const voiceChannels = member.guild.channels.filter(channel => channel.type === "voice");
		const voiceChannel = voiceChannels.find(channel => channel.name.toLowerCase() === commandArgs[0].toLowerCase());
		
		if (voiceChannel === null) {
			if (channel !== null) {
				channel.send(`${member.displayName}, the channel ${commandArgs[0]} does not exist!`)
					.then(message => console.log(`Sent message: ${message.content}`))
					.catch(console.error);
			} else {
				member.send(`${member.displayName}, the channel ${commandArgs[0]} does not exist!`)
					.then(message => console.log(`Sent message: ${message.content}`))
					.catch(console.error);
			}
		} else {
			voiceChannel.join()
				.then(connection => {
					console.log(`Joined Channel: ${connection.channel.name}`);
					listen(client, connection);
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
				member.send(`${member.displayName}, please join a voice channel first!`)
					.then(message => console.log(`Sent message: ${message.content}`))
					.catch(console.error);
			}
		} else {
			voiceChannel.join()
				.then(connection => {
					console.log(`Joined Channel: ${connection.channel.name}`);
					listen(client, connection);
				})
				.catch(console.error);
		}
	}
}

function leave(client, member, channel) {
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

function listen(client, connection) {
	// Discord doesn't allow bot to listen unless it plays audio, temporary fix until update
	connection.playFile('resources/slient.wav', {
		  volume: 0.1,
		  passes: 1
	});
	
	const receiver = connection.createReceiver();
	
	connection.on("speaking", (user, speaking) => {
		if (speaking) {
			let write = null;
			let containsListener = true;
			
			const audioStream = receiver.createPCMStream(user);
			audioStream.pipe(detector, {
				end: false
			});
			
			const callback = (index, hotword, buffer) => {
				console.log(`${hotword}`);
				containsListener = false;
				write = fs.createWriteStream(`resources/recordings/${connection.channel.id}_${user.id}_${Date.now()}.pcm`);
				audioStream.pipe(write);
			}
			
			detector.once("hotword", callback);
			
			audioStream.once("end", () => {
				if (containsListener)
					detector.removeListener("hotword", callback)
				else {
					write.end();
					speechToText(write.path, client, connection.channel.guild.members.get(user.id));
				}
			});
		}
	});
}

function speechToText(path, client, member) {
	const stream = fs.createReadStream(path);
	
	const parseSpeech =  new Promise((ressolve, reject) => {
		WitSpeech.extractSpeechIntent(API_KEY, stream, CONTENT_TYPE, 
		(err, res) => {
			if (err) return reject(err);
			ressolve(res);
		});
	});
	
	parseSpeech.then((data) => {
		getIntent(client, member, data);
	})
	.catch((err) => {
		console.log(err);
	});
	
	try {
		fs.unlinkSync(stream.path);
	} catch (err) {
		console.log(`Failed to delete file: ${stream.path}`);
	}
}

function getIntent(client, member, obj) {
	const intent = obj.entities.intent[0].value;
	
	if (intent.toLowerCase() === "leave")
		leave(client, member)
	else if (intent.toLowerCase() === "join") {
		const args = obj._text.split(" ");
		
		if (args.length > 1)
			join(client, member, null, args.slice(1));
		else
			join(client, member, null, null);
	}
}

module.exports = { join, leave };