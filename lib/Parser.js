const Channel = require("./commands/Channel.js").Channel;
const SpeechToText = require("./audio/SpeechToText.js").SpeechToText;
const TextToSpeech = require("./audio/TextToSpeech.js").TextToSpeech;

class Parser {
	constructor() {
		const speechToText = new SpeechToText();
		const textToSpeech = new TextToSpeech();
		this.channelCommands = new Channel(speechToText, textToSpeech);
	}
	
	parseTextCommand(client, member, channel, fullCommand) {
		let commandArray = fullCommand.split(" ");
		let commandName = commandArray[0];
		let commandArgs = null;
		
		if (commandArray.length > 1)
			commandArgs = commandArray.slice(1);
		
		this.runCommand(client, member, channel, commandName, commandArgs);
	}

	parseVoiceCommand(client, member, json) {
		this.runCommand(client, member, null, obj.entities.intent[0].value, json._text);
	}

	runCommand(client, member, channel, commandName, commandArgs) {
		if (commandName === "join")
			this.channelCommands.join(client, member, channel, commandArgs);
		else if (commandName === "leave")
			this.channelCommands.leave(client, member, channel);
	};
}

module.exports.Parser = Parser;