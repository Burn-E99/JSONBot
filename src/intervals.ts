import config from "../config.ts";

// getRandomStatus(bot cache) returns status as string
// Gets a new random status for the bot
const getRandomStatus = (): string => {
	let status = "";
	switch (Math.floor((Math.random() * 2) + 1)) {
		case 1:
			status = `${config.prefix}help for commands`;
			break;
		case 2:
			status = `Running V${config.version}`;
			break;
	}
	
	return status;
};

export default { getRandomStatus };
