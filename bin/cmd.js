#!/usr/bin/env node

var program = require('commander'),
  log = require('loglevel'),
  fs = require('fs'),
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
    throw err;
  }
  log.info('Success.');
}

var actions = [
  'register',
  'write',
  'read',
  'newApp',
  'newBoard'
];


var action, found = false;
for (var i = 0; i < actions.length; i++) {
  action = actions[i];
  if (program[action]) {
    dataNow[action](genericResponse);
    found = true;
    break;
  }
}
if (!found) {
  log.error('No valid action specified. Please refer to datanow --help');
}