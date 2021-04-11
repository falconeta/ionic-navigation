const { colors } = require('./utils/log'),
  fs = require('fs'),
  path = require('path');
require('./utils/build-all');

const inquier = require('inquirer');
const { buildAllWithPriority } = require('./utils/build-all');

function handleErrorWizard(method, error) {
  console.error(`Error occurred during ${method}: ${error}`)
}

async function selectIsSequential() {
  return inquier.prompt({
    type: 'confirm',
    message: `Do you want to build all libraries in prod mode?`,
    name: 'sequential',
    default: false
  })
    .then(value => value.sequential)
    .catch(error => handleErrorWizard('selection sequential', error));
}

function retrieveAvailablePackage() {
  return fs.readdirSync(path.join(__dirname, '../projects'), { withFileTypes: true })
    .filter(file => file.isDirectory())
    .map(directory => directory.name)
}

async function selectDevMode(packageName) {
  return inquier.prompt({
    type: 'confirm',
    message: `Do you want to build ${packageName} in dev mode?`,
    name: 'devMode'
  })
    .then(value => value.devMode)
    .catch(error => handleErrorWizard('selection dev mode', error));
}

async function selectWatchMode(packageName) {
  return inquier.prompt({
    type: 'confirm',
    message: `Do you want to build ${packageName} in watch mode?`,
    name: 'watchMode'
  })
    .then(value => value.watchMode)
    .catch(error => handleErrorWizard('selection watch mode', error));
}


async function selectDeleteDependencies(packageName) {
  return inquier.prompt({
    type: 'confirm',
    name: 'deleteDependencies',
    message: `Do you want to delete ${packageName} dependencies (update App Package)?`,
    default: false
  })
    .then(value => value.deleteDependencies)
    .catch(error => handleErrorWizard('selection delete dependencies', error));
}

async function selectPathFromWizard(defaultPathApp) {
  return inquier.prompt({
    type: 'input',
    name: 'path',
    message: 'Type path of your App:',
    default: defaultPathApp
  })
    .then(value => value.path)
    .catch(error => handleErrorWizard('selection of path', error));
}

async function selectLibrary() {
  const directories = retrieveAvailablePackage();
  return await inquier.prompt({
    type: 'list',
    message: 'Which library do you want to build?',
    choices: directories,
    name: 'library'
  })
    .then(libraryObject => libraryObject.library)
    .catch(error => handleErrorWizard('selection of library', error));
}

module.exports = {
  lunchWizard: async function (defaultPathApp) {
    console.log(`${colors.FgMagenta}Start the wizard process\n`);
    const isSequential = await selectIsSequential();
    if (isSequential) {
      buildAllWithPriority();
    }
    const pathApp = await selectPathFromWizard(defaultPathApp)
    const packageName = await selectLibrary()
    const isDev = await selectDevMode(packageName);
    const isWatch = await selectWatchMode(packageName);
    const isClean = await selectDeleteDependencies(packageName);
    const scriptString = `${isWatch ? '-w ' : ''}${isDev ? '-d ' : ''}${isClean ? '-c ' : ''}-n ${packageName} -p ${pathApp}`;
    console.log(`\n${colors.FgBlue} For use current settings without using the wizard use: node build-script.js ${scriptString}`);

    return {
      isClean,
      isSequential,
      isDev,
      isWatch,
      pathApp,
      packageName
    }
  },
  retrieveAvailablePackage: function () { return retrieveAvailablePackage() }
}
