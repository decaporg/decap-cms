export const RUN_COMMAND = 'RUN_COMMAND';

export function runCommand(commandName, payload) {
  return { type: RUN_COMMAND, command: commandName, payload };
}
