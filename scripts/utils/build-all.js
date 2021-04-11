const { colors } = require('./log'),
  { execSync } = require('child_process'),
  config = require('../config.json');

module.exports = {
  buildAllWithPriority: function () {
    console.log(`${colors.FgBlue}Building libraries with this priority: ${config.priority}\n`);
    for (const name of config.priority) {
      console.debug(`${colors.FgCyan}Building ${name} with flag: -n ${name} -c`)
      execSync(`node build-script.js -n ${name} -c`, { stdio: 'inherit' }, (error, stdout, stderr) => {
        if (stderr) {
          console.warn(`Warning occurred during ${name} build: ${stderr}`);
        }
        if (error) {
          console.error(`Error occurred during ${name} build: ${error}`)
          process.exit(1);
        }
        console.log(`Successfully built ${name}`);
      })
    }
    console.success(`All libraries successfully built`);
    process.exit(0);
  }
}
