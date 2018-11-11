const VoiceChannel = require("./commands/voice_channel.js");

function parseCommand(client, member, channel, fullCommand) {
	let commandArray = fullCommand.split(" ");
	let commandName = commandArray[0];
	let commandArgs = null;
	
	if (commandArray.length > 1)
		commandArgs = commandArray.slice(1);
	
	runCommand(client, member, channel, commandName, commandArgs);
}

function runCommand(client, member, channel, commandName, commandArgs) {
	if (commandName === "join")
		VoiceChannel.join(client, member, channel, commandArgs);
	else if (commandName === "leave")
		VoiceChannel.leave(client, member, channel);
};

module.exports = { parseCommand };