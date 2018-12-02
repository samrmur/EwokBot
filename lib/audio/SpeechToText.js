const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;
const WitSpeech = require('node-witai-speech');
const fs = require('fs');
const SoxCommand = require('sox-audio');
const config = require('../../config.json');

class SpeechToText {
	constructor(parser) {
		this.parser = parser;
		this.models = new Models();
		this.apiKey = config.witKey;
		this.contentType = "audio/wav";
		
		this.models.add({
			file: 'resources/jarvis.umdl',
			sensitivity: '0.8,0.80',
			hotwords: ['jarvis','jarvis']
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
				const audio = fs.createWriteStream(`resources/recordings/${connection.channel.id}_${user.id}_${Date.now()}.pcm`)
				const file = audio.path;
				const audioStream = receiver.createPCMStream(user);
				
				audioStream.pipe(audio);
				
				audioStream.once("end", () => {
					audio.end();
					
					const newFile = `${file.substring(0, (file.length - 4))}.wav`;
					let command = SoxCommand();
					
					command.input(file)
						.inputSampleRate(48000)
						.inputEncoding('signed')
						.inputBits(16)
						.inputChannels(2)
						.inputFileType('raw')
						.output(newFile)
						.outputSampleRate(16000)
						.outputEncoding('signed')
						.outputBits(16)
						.outputChannels(1)
						.outputFileType('wav');

					command.once("end", () => {
						try {
							fs.unlinkSync(file);
						} catch (err) {
							console.log(`Failed to delete file: ${file}`);
						}
						
						let containsListener = true;
						
						const callback = (index, hotword, buffer) => {
							console.log(`${hotword}`);
							containsListener = false;
						}
						
						this.detector.once("hotword", callback);
						
						const read = fs.createReadStream(newFile);
						
						read.pipe(this.detector, {
							end: false
						});
						
						read.once("end", () => {
							if (containsListener) {
								this.detector.removeListener("hotword", callback);
								console.log(`No hotword detected!`);
								
								try {
									fs.unlinkSync(newFile);
								} catch (err) {
									console.log(`Failed to delete file: ${file}`);
								}
							} else {
								this.speechToText(newFile, client, connection.channel.guild.members.get(user.id));
							}
						});
					});
					
					command.run();
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
			try {
				fs.unlinkSync(path);
			} catch (err) {
				console.log(`Failed to delete file: ${file}`);
			}
			
			this.parseIntent(client, member, data);
		})
		.catch((err) => {
			console.log(err);
		});
	}
	
	parseIntent(client, member, json) {
		console.log(JSON.stringify(json, null, 4));
		
		this.parser.parseVoiceCommand(client, member, json);
	}
}

module.exports.SpeechToText = SpeechToText;
