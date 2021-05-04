/* Command Type Structure
 * 
 * name: Name of the command.
 * desc: Description of the command for the help command.
 * aliases: Optional other names for the command.
 * deleteSender: Should the bot delete the user's message that called this command.
 * delim: Character(s) to break the params up by.
 * response: Response string.  Variables and parameters are to be wrapped in %{variable}.
 * 
 * Available Environment Variables:
 * p#: param#, where # is the index of the parameter, n will take remaining, a will take all
 */
export type Aliases = string | undefined;
export type Command = {
	name: string,
	desc: string,
	aliases: Array<Aliases>,
	deleteSender: boolean,
	delim: string,
	response: string
}
