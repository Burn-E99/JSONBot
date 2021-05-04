import {
	// Discordeno deps
	startBot, editBotsStatus, editBotNickname,
	Intents, StatusTypes, ActivityType,
	sendMessage, sendDirectMessage,
	cache,
	Message, Guild
} from "./deps.ts";

import utils from "./src/utils.ts";
import intervals from "./src/intervals.ts";

import { Command, Aliases } from "./src/commands.d.ts";

import { DEBUG, LOCALMODE } from "./flags.ts";
import config from "./config.ts";

// Load commands
const validCommands: Array<Aliases> = [];
const fullCommands: Array<Command> = [];
const cmdPath = "./src/commands/";
for (const dirEntry of Deno.readDirSync(cmdPath)) {
	if (dirEntry.isFile) {
		try {
			const command = JSON.parse(Deno.readTextFileSync(cmdPath + dirEntry.name));
			fullCommands.push(command);
			validCommands.push(command.name);
			command.aliases.map((a: string) => validCommands.push(a));
		}
		catch (e) {
			console.error(`File load error: ${e}`);
		}
	}
}

let JSONCmdsHelp = "";
fullCommands.map(cmd => JSONCmdsHelp += `${cmd.name} - ${cmd.desc}\n`);

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
					LOCALMODE && editBotNickname(config.devServer, `LOCAL - ${config.name}`);
				} catch (e) {
					console.error(`Failed to update status: ${JSON.stringify(e)}`);
				}
			}, 30000);

			// setTimeout added to make sure the startup message does not error out
			setTimeout(() => {
				editBotsStatus(StatusTypes.Online, `Boot Complete`, ActivityType.Game);
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
			
			// Ignore all messages that are not commands
			if (message.content.indexOf(config.prefix) !== 0) return;
			
			// Split into standard command + args format
			const args = message.content.slice(config.prefix.length).trim().split(/[ \n]+/g);
			const command = args.shift()?.toLowerCase();

			// All commands below here

			// ping
			// Its a ping test, what else do you want.
			if (command === "ping") {
				// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
				try {
					const m = await utils.sendIndirectMessage(message, "Ping?", sendMessage, sendDirectMessage);
					m.edit(`Pong! Latency is ${m.timestamp - message.timestamp}ms.`);
				} catch (e) {
					console.log(`Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				}
			}

			// help or h or ?
			// Help command, prints from help file
			else if (command === "help" || command === "h" || command === "?") {
				utils.sendIndirectMessage(message, `${config.name} Help Info:\n\n${JSONCmdsHelp}`, sendMessage, sendDirectMessage).catch(e => {
					console.log(`Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				});
			}

			// version or v
			// Returns version of the bot
			else if (command === "version" || command === "v") {
				utils.sendIndirectMessage(message, `My current version is ${config.version}.`, sendMessage, sendDirectMessage).catch(e => {
					console.log(`Failed to send message: ${JSON.stringify(message)} | ${JSON.stringify(e)}`);
				});
			}

			// JSON Commands
			else if (validCommands.includes(command)) {
				fullCommands.some((cmd: Command) => {
					if (command === cmd.name || cmd.aliases.includes(command)) {
						const cmdArgs = args.join(" ").split(cmd.delim);
						let response = cmd.response;

						response = response.replaceAll(`%{pa}`, args.join(" "));

						cmdArgs.forEach((p, i) => {
							response = response.replaceAll(`%{p${i}}`, p);
						});

						utils.sendIndirectMessage(message, response, sendMessage, sendDirectMessage);

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
