const fs = require('fs'),
  path = require('path'),
  { exec } = require('child_process'),
  {
    removeNodeModulesFromLibraryAndApp,
    installDepsIfNeeded
  } = require('./utils/dependencies'),
  {
    copyDir,
    moveFile
  } = require('./utils/filesystem');

installDepsIfNeeded();

const wizard = require('./wizard'),
  watch = require('watch'),
  program = require('commander'),
  { buildAllWithPriority } = require('./utils/build-all'),
  { colors, initLog } = require('./utils/log'),
  rimraf = require('rimraf');


initLog();

program
  .option('-s, --sequential', 'Build all libraries in certain order', false)
  .option('-w, --watch', 'Watch the src of selected library', false)
  .option('-d, --dev', 'Build the selected library in dev mode', false)
  .option('--debug', 'Debug this script', false)
  .option('-n, --package-name <library>', 'Library name to build (name declared inside package.json)')
  .option('-c, --clean', 'Clean all dependencies in library as well as in app', false)
  .option('-p --application-path <path>', 'Path to App', path.join(__dirname, '../../MBx'));

program.parse(process.argv);

if (program.debug) {
  console.log(`Arguments passed: `, program.opts());
}

let isWatch = program.watch,
  isDev = program.dev,
  packageName = program.packageName,
  pathApp = program.applicationPath,
  isClean = program.clean,
  isSequential = program.sequential

const appPackageJson = require(`${pathApp}/package.json`);

let isFirstRun = true;
let packageJson = "";


/**
 * Create TGZ from built files
 */
async function createTGZ() {
  return new Promise((resolve) => {
    exec('npm pack', {
      cwd: path.join(__dirname, `../dist/${packageName}`)
    }).
      on(
        'close', (success) => {
          console.log(`Created tgz`, success)
          resolve(success);
        })
      .on('error', error => {
        console.error(`Error occurred during tgz creation ${error}`);
        process.exit(1)
      })
  })
}

async function movePackageInDistFolder() {
  // RETRIEVE IT FROM SHARED-LIBRARY/PACKAGE-NAME/DIST/PACKAGE-NAME/PACKAGE-NAME-VERSION.THZ
  const from = path.join(__dirname, `../dist/${packageName}/${packageName}-${packageJson.version}.tgz`);
  // MOVE IT UNDER SHARED-LIBRARY/DIST/UC-SECURITY
  const to = path.join(__dirname, `../release/${packageName}/`);

  if (!isDev) {
    await createTGZ()
    console.log('Moving tgz in dist position');
    if (!fs.existsSync(to)) {
      fs.mkdirSync(to, { recursive: true });
    }
    moveFile(from, path.join(to, `${packageJson.version}.tgz`));
  } else {
    copyLibIntoAppDeps()
  }

  listenChangesIfNeeded();
}


function printBuildType() {
  if (isFirstRun) {
    try {
      packageJson = require(`../projects/${packageName}/package.json`);
      const paramsString = `~ ${isDev ? 'Dev build' : 'Release build'} - ${isWatch ? 'Watch build' : 'Normal build'} `;
      console.warn(`${colors.FgBlue}\n | Building ${packageJson.name} - version ${packageJson.version} ${paramsString} | \n${colors.ResetColor}`);
    } catch (error) {
      if (packageName) {
        console.error(`Unable to find ${packageName} as library! Available package: ${wizard.retrieveAvailablePackage()}`);
      } else {
        console.error(`${colors.FgRed}You didn't select any package name, please provide it with -n${colors.ResetColor}`);
      }
      process.exit(1);
    }
  }
}

function listenChangesIfNeeded() {
  // LISTENER ON SRC
  const pathToListen = path.join(__dirname, `../projects/${packageName}/src`);
  if (isWatch && isFirstRun) {
    const re = new RegExp(`${packageName}/src.*`, "g");
    console.log(`${colors.FgMagenta}Listening on: ${re.exec(pathToListen.replace(/\\/g, '/'))} ~ save a file to rebuild the library`)
    watch.createMonitor(pathToListen, (monitor) => {
      monitor.on(
        'changed',
        (change) => {
          isFirstRun = false;
          const re = new RegExp(`${packageName}/src.*`, "g");
          console.log(`${colors.FgBlue}File changed: ${re.exec(change.replace(/\\/g, '/'))}`)
          build();
        }
      )
    })
  }
}

function build() {
  if (isSequential) {
    buildAllWithPriority()
  }
  printBuildType()

  const buildScript = `cd .. && npx ng build --project ${packageName} ${!isDev ? '--prod' : ''}`;
  if (isClean) {
    removeNodeModulesFromLibraryAndApp(packageName);
  }
  exec(buildScript, (error, stdout, stderr) => {
    if (stderr) {
      console.warn(`BUILD LOG: ${stderr}`);
    }
    if (error) {
      console.error(`Error occurred during the build process: ${error}`);
      if (isFirstRun) {
        process.exit(1);
      }

    }
    console.success(`Build finished`)
    movePackageInDistFolder();
  });
  console.log('Build in progress...');
}

function copyLibIntoAppDeps() {

  if (!fs.existsSync(`${pathApp}/node_modules`)) {
    throw new Error(`node_module not present, launch npm install on ${pathApp} first`)
  }

  const pathDest = `${pathApp}/node_modules/${packageJson.name}`;

  if (isFirstRun) {
    if (fs.existsSync(pathDest)) {
      console.log(`delete folder ${pathDest}`);
      rimraf.sync(pathDest);
    }
    console.log(`copying into ${pathDest}`);
  }

  copyDir(
    path.join(__dirname, `../dist/${packageName}`),
    pathDest
  );
  if (isFirstRun) {
    console.success(`Successfully copied into ${pathDest}`);
  }
}



// WAY TO EXTRACT APPLICATION AND DEBUG FLAG (PATH EXISTS FOR DEFAULT AND DEBUG DOESN'T HAVE TO BLOCK WIZARD)
const { applicationPath, debug, ...rest } = program.opts();

if (Object.values(rest).every(value => !value)) {
  wizard.lunchWizard(pathApp).then(data => {
    isWatch = data.isWatch
    isDev = data.isDev
    packageName = data.packageName
    pathApp = data.pathApp
    isClean = data.isClean
    isSequential = data.isSequential
    build();
  });
} else {
  build();
}
