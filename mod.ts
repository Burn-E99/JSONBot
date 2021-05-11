import {
	// Discordeno deps
	startBot, editBotsStatus, editBotNickname,
	Intents, StatusTypes, ActivityType,
	sendMessage,
	cache,
	Message, Guild
} from "./deps.ts";

import utils from "./src/utils.ts";
import intervals from "./src/intervals.ts";
import handlers from "./src/handlers.ts";

import { Command } from "./src/commands.d.ts";
import { Listening } from "./src/mod.d.ts";

import { DEBUG, LOCALMODE } from "./flags.ts";
import config from "./config.ts";

// Load commands
let {validCommands, fullCommands, JSONCmdsHelp} = utils.loadJSONCommands();

// Handle idling out listeners
const activeListeners: Array<Listening> = [];
setInterval(() => {
	const currentTime = new Date().getTime();
	for (let i = 0; i < activeListeners.length; i++) {
		if (activeListeners[i].lastTouch.getTime() + (activeListeners[i].maxIdle * 1000) < currentTime) {
			activeListeners[i].botMessage.delete();
			sendMessage(activeListeners[i].channelId, `<@${activeListeners[i].userId}>, your ${activeListeners[i].handler} has timed out.  Please try again.`);
			activeListeners.splice(i, 1);
			i--;
		}
	}
}, 1000);

// Start up the Discord Bot
startBot({
	token: LOCALMODE ? config.localtoken : config.token,
	intents: [Intents.GUILD_MESSAGES, Intents.DIRECT_MESSAGES, Intents.GUILDS],
	eventHandlers: {
		ready: () => {
			editBotsStatus(StatusTypes.Online, "Booting up . . .", ActivityType.Game);

			// Interval to rotate the status text every 30 seconds to show off more commands
			setInterval(() => {
				try {
					// Wrapped in try-catch due to hard crash possible
					editBotsStatus(StatusTypes.Online, intervals.getRandomStatus(cache), ActivityType.Game);
				} catch (e) {
					console.error(`Failed to update status: ${JSON.stringify(e)}`);
				}
			}, 30000);

			// setTimeout added to make sure the startup message does not error out
			setTimeout(() => {
				editBotsStatus(StatusTypes.Online, `Boot Complete`, ActivityType.Game);
				LOCALMODE && editBotNickname(config.devServer, `LOCAL - ${config.name}`);
				sendMessage(config.logChannel, `${config.name} has started, running version ${config.version}.`).catch(e => {
					console.error(`Failed to send message: ${JSON.stringify(e)}`);
				});
			}, 1000);
		},
		guildCreate: (guild: Guild) => {
			console.log(`Handling joining guild ${JSON.stringify(guild)}`);
			sendMessage(config.logChannel, `New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`).catch(e => {
				console.error(`Failed to send message: ${JSON.stringify(e)}`);
			});
		},
		guildDelete: (guild: Guild) => {
			console.log(`Handling leaving guild ${JSON.stringify(guild)}`);
			sendMessage(config.logChannel, `I have been removed from: ${guild.name} (id: ${guild.id}).`).catch(e => {
				console.error(`Failed to send message: ${JSON.stringify(e)}`);
			});
		},
		debug: () => {},
		messageCreate: async (message: Message) => {
			// Ignore all other bots
			if (message.author.bot) return;
			
			// Ignore all messages that are not commands and not from a user that we are listening to
			if (message.content.indexOf(config.prefix) !== 0) {
				const activeIdx = activeListeners.findIndex(l => (message.channelID === l.channelId && message.author.id === l.userId));
				if (activeIdx > -1) {
					let listener: Listening = {
						handler: "",
						userId: "",
						channelId: "",
						botMessage: message,
						currentStep: -1,
						userData: [],
						lastTouch: new Date("1970"),
						maxIdle: -1
					};
					switch (activeListeners[activeIdx].handler) {
						case "make_command":
							listener = handlers.makeCommand(message, activeListeners[activeIdx]);
							break;
						default:
							listener.handler = "done";
							sendMessage(message.channelID, "Handler not implemented");
							break;
					}

					if (listener.handler.startsWith("done")) {
						if (listener.handler === "done_mc") {
							({validCommands, fullCommands, JSONCmdsHelp} = utils.loadJSONCommands());
							listener.botMessage.edit(`New command ${listener.userData[0]} created and commands reloaded.\n\nVerify the new command works with ${config.prefix}${listener.userData[0]}`);
						}
						activeListeners.splice(activeIdx, 1);
					}
				}
				return;
			}
			
			// Split into standard command + args format
			const args = message.content.slice(config.prefix.length).trim().split(/[ \n]+/g);
			const command = args.shift()?.toLowerCase();

			// All commands below here

			// ping
			// Its a ping test, what else do you want.
			if (command === "ping") {
				// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
				try {
					const m = await sendMessage(message.channelID, "Ping?");
					m.edit(`Pong! Latency is ${m.timestamp - message.timestamp}ms.`);
				} catch (e) {
					console.log(`Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				}
			}

			// help or h or ?
			// Help command, prints from help file
			else if (command === "help" || command === "h" || command === "?") {
				sendMessage(message.channelID, `${config.name} Help Info:\n\n${JSONCmdsHelp}`).catch(e => {
					console.log(`Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				});
			}

			// version or v
			// Returns version of the bot
			else if (command === "version" || command === "v") {
				sendMessage(message.channelID, `My current version is ${config.version}.`).catch(e => {
					console.log(`Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				});
			}

			// make or m $name
			// Makes a new JSON command
			else if ((command === "make" || command === "m") && message.author.id === config.owner && args.length === 1) {
				const m = await sendMessage(message.channelID, `Creating new command ${args[0]}:\n\nPlease enter a description for the command:`);

				activeListeners.push({
					handler: "make_command",
					userId: message.author.id,
					channelId: message.channelID,
					botMessage: m,
					currentStep: 1,
					userData: [args[0]],
					lastTouch: new Date(),
					maxIdle: 2*60
				});
			}

			// reloadjson
			// Reloads all JSON commands
			else if (command === "reloadjson" && message.author.id === config.owner) {
				const m = await sendMessage(message.channelID, "Reloading commands . . .");

				({validCommands, fullCommands, JSONCmdsHelp} = utils.loadJSONCommands());

				m.edit("JSON Commands reloaded");
			}

			// JSON Commands
			// Handles all JSON commands, see ./src/commands/ for details of all commands
			else if (validCommands.includes(command)) {
				fullCommands.some((cmd: Command) => {
					if (command === cmd.name || cmd.aliases.includes(command)) {
						const cmdArgs = args.join(" ").trim().split(cmd.delim);
						let response = cmd.response;

						while (response.includes("@[")) {
							const codeStart = response.indexOf("@[") + 2;
							const codeEnd = response.indexOf("]@");
							const tempCode = response.substr(codeStart, codeEnd - codeStart);

							const codeResult = eval(tempCode);

							response = response.replace(`@[${tempCode}]@`, codeResult);
						}

						response = response.replaceAll(`%{pa}`, args.join(" ").trim());

						cmdArgs.forEach((p, i) => {
							response = response.replaceAll(`%{p${i}}`, p.trim());
						});

						sendMessage(message.channelID, response);

						if (cmd.deleteSender) {
							message.delete().catch(e => {
								console.log(`Failed to delete message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
							});
						}

						return true;
					}
				})
			}
		}
	}
});

// Start up the command prompt for debug usage
if (DEBUG) {
	utils.cmdPrompt(config.logChannel, config.name, sendMessage);
}
