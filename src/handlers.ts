import {
	Message
} from "../deps.ts";

import { Listening } from "./mod.d.ts";
import { Command } from "./commands.d.ts";

import config from "../config.ts";

const makeCommand = (message: Message, listener: Listening): Listening => {
	listener.lastTouch = new Date();
	switch (listener.currentStep) {
		case 1:
			listener.userData.push(message.content);
			listener.currentStep = 2;
			listener.botMessage.edit(`Creating new command ${listener.userData[0]}:\n\nPlease enter all aliases in a space separated list:`);
			break;
		case 2:
			listener.userData.push(message.content.toLowerCase());
			listener.currentStep = 3;
			listener.botMessage.edit(`Creating new command ${listener.userData[0]}:\n\nShould the bot delete the user's message [y/n]:`);
			break;
		case 3:
			listener.userData.push(message.content.toLowerCase());
			listener.currentStep = 4;
			listener.botMessage.edit(`Creating new command ${listener.userData[0]}:\n\nIf needed, what is the delimiter for the new command?  Skip with \`<skip>\`, spacebar with \`<space>\`:`);
			break;
		case 4:
			listener.userData.push(message.content.toLowerCase().replace("<skip>", "").replace("<space>", " "));
			listener.currentStep = 5;
			listener.botMessage.edit(`Creating new command ${listener.userData[0]}:\n\nPlease enter the response the bot should evaluate.  Details are in \`make help\`:`);
			break;
		case 5: {
			listener.userData.push(message.content);
			listener.handler = "done_mc";
			listener.botMessage.edit(`Writing new command ${listener.userData[0]} . . .`);

			const tempCommand: Command = {
				name: listener.userData[0],
				desc: listener.userData[1],
				aliases: listener.userData[2].split(" "),
				deleteSender: listener.userData[3] === "y",
				delim: listener.userData[4],
				response: listener.userData[5]
			};
			Deno.writeTextFileSync(`${config.cmdPath}${listener.userData[0]}.json`, JSON.stringify(tempCommand));

			listener.botMessage.edit(`New command ${listener.userData[0]} written, reloading commands . . .`);
			break;
		}
		default:
			break;
	}
	message.delete();
	return listener;
};

export default { makeCommand };
