export const config = {
	'name': 'Jason', // Name of the bot
	'version': '1.0.1', // Version of the bot
	'token': 'the_bot_token', // Discord API Token for this bot
	'localtoken': 'local_testing_token', // Discord API Token for a secondary OPTIONAL testing bot, THIS MUST BE DIFFERENT FROM "token"
	'prefix': '!', // Prefix for all commands
	'logChannel': 'the_log_channel', // Discord channel ID where the bot should put startup messages and other error messages needed
	'devServer': 'the_dev_server', // Discord guild ID where testing of indev features/commands will be handled, used in conjuction with the DEVMODE bool in mod.ts
	'owner': 'the_bot_owner', // Discord user ID of the bot admin
	'cmdPath': './src/commands/', // Path to the folder where commands are stored.  Must be relative to mod.ts and end in /
};

export default config;
