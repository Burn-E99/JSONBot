import {
	// Discordeno deps
	Message,
} from "../deps.ts";

import { Command, Aliases } from "./commands.d.ts";

import config from "../config.ts";

// ask(prompt) returns string
// ask prompts the user at command line for message
const ask = async (question: string, stdin = Deno.stdin, stdout = Deno.stdout): Promise<string> => {
	const buf = new Uint8Array(1024);

	// Write question to console
	await stdout.write(new TextEncoder().encode(question));

	// Read console's input into answer
	const n = <number>await stdin.read(buf);
	const answer = new TextDecoder().decode(buf.subarray(0, n));

	return answer.trim();
};

// cmdPrompt(logChannel, botName, sendMessage) returns nothing
// cmdPrompt creates an interactive CLI for the bot, commands can vary
const cmdPrompt = async (logChannel: string, botName: string, sendMessage: (c: string, m: string) => Promise<Message>): Promise<void> => {
	let done = false;

	while (!done) {
		// Get a command and its args
		const fullCmd = await ask("cmd> ");

		// Split the args off of the command and prep the command
		const args = fullCmd.split(" ");
		const command = args.shift()?.toLowerCase();

		// All commands below here

		// exit or e
		// Fully closes the bot
		if (command === "exit" || command === "e") {
			console.log(`${botName} Shutting down.\n\nGoodbye.`);
			done = true;
			Deno.exit(0);
		}
		
		// stop
		// Closes the CLI only, leaving the bot running truly headless
		else if (command === "stop") {
			console.log(`Closing ${botName} CLI.  Bot will continue to run.\n\nGoodbye.`);
			done = true;
		}
		
		// m [channel] [message]
		// Sends [message] to specified [channel]
		else if (command === "m") {
			try {
				const channelID = args.shift() || "";
				const message = args.join(" ");

				sendMessage(channelID, message).catch(reason => {
					console.error(reason);
				});
			}
			catch (e) {
				console.error(e);
			}
		}
		
		// ml [message]
		// Sends a message to the specified log channel
		else if (command === "ml") {
			const message = args.join(" ");

			sendMessage(logChannel, message).catch(reason => {
				console.error(reason);
			});
		}
		
		// help or h
		// Shows a basic help menu
		else if (command === "help" || command === "h") {
			console.log(`${botName} CLI Help:\n\nAvailable Commands:\n  exit - closes bot\n  stop - closes the CLI\n  m [ChannelID] [messgae] - sends message to specific ChannelID as the bot\n  ml [message] sends a message to the specified botlog\n  help - this message`);
		}
		
		// Unhandled commands die here
		else {
			console.log("undefined command");
		}
	}
};

const loadJSONCommands = (): {validCommands: Array<Aliases>, fullCommands: Array<Command>, JSONCmdsHelp: string} => {
	// Load commands
	const validCommands: Array<Aliases> = [];
	const fullCommands: Array<Command> = [];
	for (const dirEntry of Deno.readDirSync(config.cmdPath)) {
		if (dirEntry.isFile) {
			try {
				const command = JSON.parse(Deno.readTextFileSync(config.cmdPath + dirEntry.name));
				fullCommands.push(command);
				validCommands.push(command.name);
				command.aliases.map((a: string) => validCommands.push(a));
				console.log(`Command loaded: ${command.name}`);
			}
			catch (e) {
				console.error(`File load error: ${e}`);
			}
		}
	}

	let JSONCmdsHelp = "";
	fullCommands.map(cmd => !cmd.secret && (JSONCmdsHelp += `${cmd.name} - ${cmd.desc}\n`));

	return {validCommands, fullCommands, JSONCmdsHelp};
};

export default { cmdPrompt, loadJSONCommands };
