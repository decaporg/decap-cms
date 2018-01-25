/**
 * Script to copy assets over local dev based on context
 * Note: this is used by the build command, because we are handling 2 build sites in
 *        the repository at this time. Otherwise setup would be in the netlify.toml
 */
const { spawn } = require('child_process');

const command = `cp example/assets/${ process.env.CONTEXT }/* example/`;
const options = { stdio: 'inherit', shell: true };

const child = spawn(command, options);

child.on('exit', (code, signal) => {
  console.log(`build-command process exited with code ${code} and signal ${signal}`);
  if (code !== 0) throw new Error(`error in build-command`);
});
