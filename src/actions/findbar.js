export const RUN_COMMAND = 'RUN_COMMAND';

export function runCommand(commandName, paramName, paramValue) {
  return { type: RUN_COMMAND, command: commandName, payload: { [paramName]: paramValue } };
}
