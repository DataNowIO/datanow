#!/usr/bin/env node

var program = require('commander'),
  log = require('loglevel'),
  helper = require('./helper.js'),
  DataNow = require('../src/index.js'),
  packageInfo = require('../package.json');


program
  .version(packageInfo.version)
  .option('-c, --config <path>', 'Path to custom config file. Defaults to ~/.datanow-config.json')
  .option('-t, --token <token>', 'Token to use (Overrides config file).')
  .option('-t, --server <server>', 'Server to use (Overrides https://datanow.io).')
  .option('-d, --loglevel <level>', 'Set logging level (trace, debug, info, warn, error). Defaults to info.')


var config = {};

function setParentConfig(program, config) {
  config.config = program.config;
  config.token = program.token;
  config.server = program.server;
  config.loglevel = program.loglevel ? program.loglevel : 'info';

  log.setLevel(config.loglevel);
}

program
  .command('register')
  .description('register an account with datanow.io')
  .option('-u, --username <username>', 'User\'s desired username.')
  .option('-e, --email <email>', 'User\'s email address.')
  .option('-p, --password <password>', 'User\'s password.')
  .option('-l, --noLogin', 'Stops the automatic login after registration.')
  .action(function(options) {

    setParentConfig(options.parent, config);

    config.username = options.username;
    config.email = options.email;
    config.password = options.password;
    config.login = !options.noLogin;

    var dataNow = new DataNow(config);

    helper.promptMissingCredentials(config, true, function(err, result) {
      if (err) {
        return helper.genericError(err);
      }
      dataNow.register(
        result.username,
        result.email,
        result.password,
        program.login,
        helper.genericResponse
      );
    });
  });



program
  .command('login')
  .description('login to datanow.io')
  .option('-u, --username <username>', 'User\'s desired username.')
  .option('-e, --email <email>', 'User\'s email address.')
  .option('-p, --password <password>', 'User\'s password.')
  .action(function(options) {

    setParentConfig(options.parent, config);

    config.username = options.username;
    config.email = options.email;
    config.password = options.password;

    var dataNow = new DataNow(config);

    //TODO: only require username or email
    helper.promptMissingCredentials(config, true, function(err, result) {
      if (err) {
        return helper.genericError(err);
      }
      dataNow.login(
        result.username,
        result.email,
        result.password,
        helper.genericResponse
      );
    });
  });



program
  .command('create <app/board>')
  .description('create a app or board. (e.g. datanow create testApp/testBoard)')
  .action(function(appOrBoard, options) {

    setParentConfig(options.parent, config);

    var dataNow = new DataNow(config);

    var splitIndex = appOrBoard.indexOf('/');
    var isApp = splitIndex === -1;

    if (isApp) {
      dataNow.newApp(
        appOrBoard,
        helper.genericResponse
      );
    } else {
      var split = appOrBoard.split('/');
      var app = split[0];
      var board = split[1];

      dataNow.newBoard(
        app,
        board,
        helper.genericResponse
      );
    }
  });




program
  .command('write <data>')
  .description('Write data to a board (string, date, number).')
  .option('-b, --board <app/board>', 'Override the current board.')
  .action(function(data, options) {

    setParentConfig(options.parent, config);

    var dataNow = new DataNow(config);

    //TODO: Remove duplicate code
    var app, board;
    if (options.board) {
      if (options.board.indexOf('/') === -1) {
        return helper.genericError('Specified board is not in the correct format (eg appName/boardName).');
      }
      var split = options.board.split('/');
      app = split[0];
      board = split[1];

      dataNow.write(
        app,
        board,
        data,
        helper.genericResponse
      );
    } else {
      dataNow.write(data, helper.genericResponse);
    }


  });


program
  .command('read')
  .description('Read data from a board.')
  .option('-b, --board <app/board>', 'Override the current board.')
  .action(function(options) {

    setParentConfig(options.parent, config);

    var dataNow = new DataNow(config);

    var dataResponse = function(err, data) {
      if (err) {
        return helper.genericError(err);
      }
      log.info(data);
    }

    //TODO: Remove duplicate code
    var app, board;
    if (options.board) {
      if (options.board.indexOf('/') === -1) {
        return helper.genericError('Specified board is not in the correct format (eg appName/boardName).');
      }
      var split = options.board.split('/');
      app = split[0];
      board = split[1];

      dataNow.read(
        app,
        board,
        dataResponse
      );
    } else {
      dataNow.read(
        dataResponse
      );
    }



  });



program
  .command('use <app/board>')
  .description('Set the current board.')
  .action(function(boardNamespace, options) {

    setParentConfig(options.parent, config);

    //TODO: Remove duplicate code
    var app, board;
    if (boardNamespace) {
      if (boardNamespace.indexOf('/') === -1) {
        return helper.genericError('Specified board is not in the correct format (eg appName/boardName).');
      }
      var split = boardNamespace.split('/');
      app = split[0];
      board = split[1];
    }

    var dataNow = new DataNow(config);

    dataNow.use(
      app,
      board,
      helper.genericResponse
    );
  });



program.parse(process.argv);