const fs = require('fs'),
  { execSync } = require('child_process'),
  path = require('path');

function installDepsIfNeeded() {
  if (
    !fs.existsSync(path.join(__dirname, '../../package-lock.json')) ||
    !fs.existsSync(path.join(__dirname, '../../node_modules'))
  ) {
    installProjectDependencies();
  }
}

function installProjectDependencies() {
  console.warn(`Trying to install project dependencies`);
  execSync(`cd ../ && npm install`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Unable to install dependencies for the following error: ${error}`);
      process.exit(1);
    }
    if (stderr) {
      console.warn(stderr);
    }
    console.success(`Successfully installed dependencies`);
  })
}

function removeNodeModulesFromLibraryAndApp(packageName, pathApp) {
  const rimraf = require("rimraf");
  const directoryToDelete = path.join(__dirname, `${pathApp}/node_modules/@uc/${packageName.split('-')[1]}`);
  if (fs.existsSync(directoryToDelete)) {
    console.warn(`Trying to remove ${pathApp}/node_modules/${packageName}`);
    try {
      rimraf.sync(directoryToDelete);
      console.success(`Successfully deleted ${pathApp}/node_modules/${packageName}`)
    } catch (error) {
      console.error(`Unable to delete ${pathApp}/node_modules/${packageName} for the following error: ${error}`)
    }
  }

  const packageLockPath = path.join(__dirname, `${pathApp}/package-lock.json`);
  if (fs.existsSync(packageLockPath)) {
    console.warn(`Trying to remove ${pathApp}/package-lock.json`);
    try {
      fs.unlinkSync(packageLockPath);
      console.success(`package-lock.json successfully deleted`);
    } catch (error) {
      console.error(`Unable to delete package-lock.json for the following error: ${error}`);
    }
  }
}


module.exports = {
  removeNodeModulesFromLibraryAndApp: removeNodeModulesFromLibraryAndApp,
  installDepsIfNeeded: installDepsIfNeeded
}
