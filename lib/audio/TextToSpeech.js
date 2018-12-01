const tts = require('@google-cloud/text-to-speech');
const fs = require('fs');

class TextToSpeech {
	constructor() {
		this.ttsClient = new tts.TextToSpeechClient();
	}
	
	play(connection, input) {
		const request = {
			input: {text: input},
			voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
			audioConfig: {audioEncoding: 'LINEAR16'}
		};
		
		this.ttsClient.synthesizeSpeech(request, (err, response) => {
			if (err) {
				console.log(err);
				return;
			}
			
			const path = `./resources/recordings/speech_${connection.channel.id}_${Date.now()}.wav`;
			
			fs.writeFile(path, response.audioContent, 'binary', err => {
				if (err) {
					console.log(err);
					return;
				}
			});
			
			const dispatcher = connection.playFile(path);
			dispatcher.on("end", (reason) => {
				try {
					fs.unlinkSync(path);
				} catch (err) {
					console.log(`Failed to delete file: ${stream.path}`);
				}
			});
		});
	}
}

module.exports.TextToSpeech = TextToSpeech;