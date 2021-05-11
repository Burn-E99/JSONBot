// All external dependancies are to be loaded here to make updating dependancy versions much easier
export {
	startBot, editBotsStatus, editBotNickname,
	Intents, StatusTypes, ActivityType,
	sendMessage,
	cache, botID,
	memberIDHasPermission
} from "https://deno.land/x/discordeno@10.5.0/mod.ts";

export type {
	CacheData, Message, Guild, MessageContent 
} from "https://deno.land/x/discordeno@10.5.0/mod.ts";
