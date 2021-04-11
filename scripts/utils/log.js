const config = require('../config.json'),
  log4js = require('log4js');

const log = console.log,
  error = console.error,
  warn = console.warn;


const colors = {
  "FgBlack": "\x1b[30m",
  "FgRed": "\x1b[31m",
  "FgGreen": "\x1b[32m",
  "FgYellow": "\x1b[33m",
  "FgBlue": "\x1b[34m",
  "FgMagenta": "\x1b[35m",
  "FgCyan": "\x1b[36m",
  "FgWhite": "\x1b[37m",
  "ResetColor": "\x1b[0m"
};

const addZero = (el) => ((el.toString().length === 1) ? '0' : '') + el.toString();
function formattedDate() {
  const date = new Date();
  // FORMAT DATE IN HH:MM:SS
  return [`[${addZero(date.getHours())}:${addZero(date.getMinutes())}:${addZero(date.getSeconds())}]`]
}

function removeColor(message) {
  return message;
}


module.exports = {
  colors,
  /**
   * @returns Console - You can assign this value to console.log or just use with console (side effect)
   */
  initLog: function () {
    // INIT LOG FILE
    const date = new Date();
    const fileName = `${addZero(date.getDay())}_${addZero(date.getMonth())}_${addZero(date.getFullYear())}_${addZero(date.getHours())}${addZero(date.getMinutes())}${addZero(date.getSeconds())}`;
    const extension = `.log`;

    log4js.configure({
      appenders: {
        'file': { type: 'file', filename: `${config.pathLog}/${fileName}${extension}` }
      },
      categories: {
        default: { appenders: ['file'], level: 'debug' },
      }
    });

    const logger = log4js.getLogger('[LIBRARY]');

    // INIT LOGGER
    console.log = function () {
      log.apply(console, formattedDate().concat(arguments[0], colors.ResetColor))
      logger.debug(removeColor(arguments[0]));
    };
    console.error = function () {
      error.apply(console, [...formattedDate(), colors.FgRed, arguments[0], colors.ResetColor]);
      logger.error(removeColor(arguments[0]));
    };
    console.warn = function () {
      warn.apply(console, [...formattedDate(), colors.FgYellow, arguments[0], colors.ResetColor]);
      logger.warn(removeColor(arguments[0]));
    };
    console.success = function () {
      log.apply(console, [...formattedDate(), colors.FgGreen, arguments[0], colors.ResetColor])
      logger.info(removeColor(arguments[0]));
    }

    return console;
  },

}
