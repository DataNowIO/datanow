#!/usr/bin/env node

var log = require('loglevel'),
  helper = require('./helper.js'),
  DataNow = require('../src/index.js')

var util = require("util");
var events = require("events");

var Command = function(program) {
console.log(this);
//TODO: Fix this.
// log.setLevel('debug');

var config = {
  register: program.register,
  username: program.username,
  email: program.email,
  config: program.config,
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

log.debug('starting', program.server);

});
};
util.inherits(Command, events.EventEmitter);


module.exports = Command;




// if (program.register || program.login) {
//
// } else if (typeof program.write !== 'undefined') {
//   program.app = program.app ? program.app : config.username;
//   helper.required(['app', 'board'], program);
//   dataNow.write(
//     program.app,
//     program.board,
//     program.write,
//     helper.genericResponse
//   );
//
// } else if (program.read) {
//   program.app = program.app ? program.app : config.username;
//   helper.required(['app', 'board'], program);
//   dataNow.read(
//     program.app,
//     program.board,
//     helper.genericResponse
//   );
//
// } else if (program.newApp) {
//   dataNow.newApp(
//     program.newApp,
//     helper.genericResponse
//   );
// } else if (program.newBoard) {
//   program.app = program.app ? program.app : config.username;
//   helper.required(['app'], program);
//   dataNow.newBoard(
//     program.app,
//     program.newBoard,
//     helper.genericResponse
//   );
// } else {
//   log.error('No valid action specified. Please refer to `datanow --help`');
// }