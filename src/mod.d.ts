import { Message } from '../deps.ts';

/* Listening Type Structure
 *
 * handler: Name of the function that will handle this multi-step action.
 * userId: Discord user ID for the user to listen to.
 * channelId: Discord channel ID for the channel to listen for the user in.
 * currentStep: Number representing the step the user is currently on.  Varies per handler
 * userData: Array of strings, holding the data for the handler to process.  Each item in the array matches up with each step of the handler.
 * lastTouch: DateTime object that keeps track of when the user last responded to avoid listening to someone forever.
 * maxIdle: Number of seconds (1 = 1 second) before the Listening object should be deleted.
 */
export type Listening = {
	handler: string;
	userId: string;
	channelId: string;
	botMessage: Message;
	currentStep: number;
	userData: Array<string>;
	lastTouch: Date;
	maxIdle: number;
};
