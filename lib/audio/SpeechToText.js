const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;
const WitSpeech = require('node-witai-speech');
const fs = require('fs');
const config = require('../../config.json');

class SpeechToText {
	constructor(parser) {
		this.parser = parser;
		this.models = new Models();
		this.apiKey = config.witKey;
		this.contentType = "audio/raw;encoding=signed-integer;bits=32;rate=44000;endian=little";
		
		this.models.add({
			file: 'resources/jarvis.umdl',
			sensitivity: '0.3,0.3',
			hotwords: ['jarvis','jarvis2']
		});
		
		this.detector = new Detector({
			resource: "node_modules/snowboy/resources/common.res",
			models: this.models,
			applyFrontend: true
		});
	}
	
	listen(client, connection) {
		// Discord doesn't allow bot to listen unless it plays audio, temporary fix until update
		connection.playFile("resources/silent.wav", {
			  volume: 0.1,
			  passes: 1
		});
		
		const receiver = connection.createReceiver();
		
		connection.on("speaking", (user, speaking) => {
			if (speaking) {
				let write = null;
				let containsListener = true;
				
				const audioStream = receiver.createPCMStream(user);
				audioStream.pipe(this.detector, {
					end: false
				});
				
				const callback = (index, hotword, buffer) => {
					console.log(`${hotword}`);
					containsListener = false;
					write = fs.createWriteStream(`resources/recordings/${connection.channel.id}_${user.id}_${Date.now()}.pcm`);
					audioStream.pipe(write);
				}
				
				this.detector.once("hotword", callback);
				
				audioStream.once("end", () => {
					if (containsListener)
						this.detector.removeListener("hotword", callback)
					else {
						write.end();
						this.speechToText(write.path, client, connection.channel.guild.members.get(user.id));
					}
				});
			}
		});
	}

	speechToText(path, client, member) {
		const stream = fs.createReadStream(path);
		
		const parseSpeech =  new Promise((ressolve, reject) => {
			WitSpeech.extractSpeechIntent(this.apiKey, stream, this.contentType, 
			(err, res) => {
				if (err) return reject(err);
				ressolve(res);
			});
		});
		
		parseSpeech.then((data) => {
			this.parseIntent(client, member, data);
		})
		.catch((err) => {
			console.log(err);
		});
		
		try {
			fs.unlinkSync(path);
		} catch (err) {
			console.log(`Failed to delete file: ${path}`);
		}
	}
	
	parseIntent(client, member, json) {
		this.parser.parseCommand(client, member, json);
	}
}

module.exports.SpeechToText = SpeechToText;