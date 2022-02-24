const winston = require('winston')

// Supress error handling
// winston.emitErrs = false
// Set default NYPL agreed upon log levels
const nyplLogLevels = {
  levels: {
    emergency: 0,
    alert: 1,
    critical: 2,
    error: 3,
    warning: 4,
    notice: 5,
    info: 6,
    debug: 7
  }
}

const getLogLevelCode = (levelString) => {
  switch (levelString) {
    case 'emergency':
      return 0
    case 'alert':
      return 1
    case 'critical':
      return 2
    case 'error':
      return 3
    case 'warning':
      return 4
    case 'notice':
      return 5
    case 'info':
      return 6
    case 'debug':
      return 7
    default:
      return 'n/a'
  }
}

const timestamp = () => new Date().toISOString()
const formatter = (options) => {
  const result = {
    timestamp: options.timestamp(),
    levelCode: getLogLevelCode(options.level),
    level: options.level.toUpperCase()
  }

  if (process.pid) {
    result.pid = process.pid.toString()
  }

  if (options.message) {
    result.message = options.message
  }

  return JSON.stringify(result)
}

const loggerTransports = []

loggerTransports.push(new winston.transports.Console({
  handleExceptions: true,
  json: false,
  stringify: true,
  colorize: true,
  timestamp,
  formatter
}))

const logger = winston.createLogger({
  levels: nyplLogLevels.levels,
  transports: loggerTransports,
  exitOnError: false
})

/**
 *  Set logging level (e.g. 'debug','info','warn','error','critical')
 */
logger.setLevel = (level) => {
  logger.transports.forEach((transport) => { transport.level = level })
}
module.exports = logger
