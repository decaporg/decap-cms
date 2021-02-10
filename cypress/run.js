const execa = require('execa');
const globby = require('globby');

const runCypress = async () => {
  if (process.env.IS_FORK === 'true') {
    const machineIndex = parseInt(process.env.MACHINE_INDEX);
    const machineCount = parseInt(process.env.MACHINE_COUNT);
    const specs = await globby(['cypress/integration/*spec*.js']);
    const specsPerMachine = Math.floor(specs.length / machineCount);
    const start = (machineIndex - 1) * specsPerMachine;
    const machineSpecs =
      machineIndex === machineCount
        ? specs.slice(start)
        : specs.slice(start, start + specsPerMachine);

    await execa(
      'cypress',
      ['run', '--browser', 'chrome', '--headless', '--spec', machineSpecs.join(',')],
      { stdio: 'inherit', preferLocal: true },
    );
  } else {
    await execa(
      'cypress',
      [
        'run',
        '--browser',
        'chrome',
        '--headless',
        '--record',
        '--parallel',
        '--ci-build-id',
        process.env.GITHUB_SHA,
        '--group',
        'GitHub CI',
      ],
      { stdio: 'inherit', preferLocal: true },
    );
  }
};

runCypress();
