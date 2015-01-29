#!/usr/bin/env node

var program = require('commander'),
  log = require('loglevel'),
  fs = require('fs'),
  prompt = require('prompt'),
  _ = require('lodash'),
  packageInfo = require('../package.json');

function range(val) {
  return val.split(',').map(String);
}


program
  .version(packageInfo.version)
  .option('-R, --register', 'Registers user. Requires username and email.')
  .option('-u, --username <username>', 'User\'s desired username.')
  .option('-e, --email <email>', 'User\'s email address.')
  .option('-c, --config <path>', 'Path to custom config file. Defaults to ~/.datanow/config.json')
  .option('-a, --app <app name>', 'Specifies app to use. Defaults to username.')
  .option('-b, --board <board name>', 'Specifies board to use.')
  .option('-A, --newApp <app name>', 'Creates a new app.')
  .option('-B, --newBoard <board name>', 'Creates a new data board.')
  .option('-s, --schema <a>,<b>', 'Specifies the board\'s schema (e.g. date,number,string)', range)
  .option('-w, --write <n>', 'Data to write (string, date, number).')
  .option('-r, --read', 'Reads the data from a board.')
  .option('-t, --token <token>', 'Token to use (Overrides config file).')
  .option('-t, --server <server>', 'Server to use (Overrides https://datanow.io).')
  .option('-d, --loglevel <level>', 'Set logging level (trace, debug, info, warn, error). Defaults to info.')
  .parse(process.argv);


var config = {
  register: program.register,
  username: program.username,
  email: program.email,
  config: program.config ? program.config : '~/.datanow/config.json',
  app: program.app,
  board: program.board,
  newApp: program.newApp,
  newBoard: program.newBoard,
  schema: program.schema,
  write: program.write,
  read: program.read,
  token: program.token,
  server: program.server,
  loglevel: program.loglevel ? program.loglevel : 'info',
};

log.setLevel(config.loglevel);

//Attempt to read the config file.
if (fs.existsSync(config.config)) {
  try {
    var conf = JSON.parse(fs.readFileSync(config.config, 'utf8'));
    config = _.merge(config, conf);
    log.debug('Loaded config', conf);
  } catch (e) {
    log.error('Error parsing config file.', e);
    process.exit(1);
  }
} else if (program.config) {
  log.error('Config file not found.');
  process.exit(1);
}

var DataNow = require('../src/index.js');
var dataNow = new DataNow(config);

var genericResponse = function(err) {
  if (err) {
    return genericError(err);
  }
  log.info('Success.');
};

var genericError = function(err) {
  if (err instanceof Error) {
    log.error(err.stack);
  } else {
    log.error(err);
  }
  process.exit(1);
};

if (program.register) {
  //Ask for username, email and/or password depending on what was supplied
  prompt.message = '';
  prompt.delimiter = '';
  prompt.start();
  var schema = {
    properties: {

    }
  };
  if (!program.username) {
    schema.properties.username = {
      description: 'Enter your username:',
      required: true,
      pattern: /^[a-zA-Z0-9]+$/,
      message: 'Username must be letters or numbers.'
    };
  }
  if (!program.email) {
    schema.properties.email = {
      description: 'Enter your email:',
      required: true,
      pattern: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      message: 'Must be a valid email address'
    };
  }
  schema.properties.password = {
    description: 'Enter your password:',
    hidden: true
  };

  prompt.get(schema, function(err, result) {
    if (err) {
      return genericError(err);
    }
    dataNow.register(
      result.username ? result.username : program.username,
      result.email ? result.email : program.email,
      result.password ? result.password : program.password,
      genericResponse
    );
  })



} else if (program.write) {

} else if (program.read) {

} else if (program.newApp) {

} else if (program.newBoard) {

} else {
  log.error('No valid action specified. Please refer to `datanow --help`');
}