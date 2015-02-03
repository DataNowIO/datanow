#!/usr/bin/env node

var program = require('commander'),
  log = require('loglevel'),
  helper = require('./helper.js'),
  DataNow = require('../src/index.js'),
  packageInfo = require('../package.json');

var dataNow;

program
  .version(packageInfo.version)
  .option('-c, --config <path>', 'Path to custom config file. Defaults to ~/.datanow-config.json')
  .option('-t, --token <token>', 'Token to use (Overrides config file).')
  .option('-t, --server <server>', 'Server to use (Overrides https://datanow.io).')
  .option('-l, --loglevel <level>', 'Set logging level (trace, debug, info, warn, error). Defaults to info.')


var config = {};

function setParentConfig(program, config) {
  config.config = program && program.config ? program.config : config.config;
  config.token = program && program.token ? program.token : config.token;
  config.server = program && program.server ? program.server : config.server;
  config.loglevel = program && program.loglevel ? program.loglevel : config.loglevel;

  log.setLevel(config.loglevel ? config.loglevel : 'info');
}


program
  .command('register')
  .description('register an account with datanow.io')
  .option('-u, --username <username>', 'User\'s desired username.')
  .option('-e, --email <email>', 'User\'s email address.')
  .option('-p, --password <password>', 'User\'s password.')
  .option('-L, --noLogin', 'Stops the automatic login after registration.')
  .action(function(options) {

    setParentConfig(options.parent, config);

    config.username = options.username;
    config.email = options.email;
    config.password = options.password;
    config.login = !options.noLogin;

    dataNow = new DataNow(config);

    helper.promptMissingCredentials(config, true, function(err, result) {
      if (err) {
        return helper.genericError(err);
      }
      dataNow.register(
        result.username,
        result.email,
        result.password,
        config.login,
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

    dataNow = new DataNow(config);

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
  .command('logout')
  .description('logout of datanow.io and delete saved tokens.')
  .action(function(options) {

    setParentConfig(options.parent, config);

    dataNow = new DataNow(config);

    dataNow.logout(helper.genericResponse);
  });



program
  .command('create <app/board> [schema-type...]')
  .description('create a app or board. (e.g. datanow create testApp/testBoard date number)')
  .option('-U, --dontUse', 'Don\'t automatically use the new board.')
  .action(function(appOrBoard, schema, options) {

    setParentConfig(options.parent, config);

    dataNow = new DataNow(config);

    var splitIndex = appOrBoard.indexOf('/');
    var isApp = splitIndex === -1;

    if (isApp) {

      if (schema.length > 0) {
        return helper.genericError('Applications don\'t have a schema.');
      }

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
        schema.length > 0 ? schema : null,
        helper.genericResponse
      );

      if (typeof options.dontUse == 'undefined') {
        dataNow.config({
          currentApp: app,
          currentBoard: board
        });
      }
    }
  });




program
  .command('write <data> [moreData...]')
  .description('Write data to a board (string, date, number).')
  .option('-b, --board <app/board>', 'Override the current board.')
  .action(function(data, moreData, options) {

    setParentConfig(options.parent, config);

    moreData.splice(0, 0, data);

    dataNow = new DataNow(config);

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
        moreData,
        helper.genericResponse
      );
    } else {
      dataNow.write(moreData, helper.genericResponse);
    }


  });


program
  .command('read')
  .description('Read data from a board.')
  .option('-b, --board <app/board>', 'Override the current board.')
  .action(function(options) {

    setParentConfig(options.parent, config);

    dataNow = new DataNow(config);

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
  .command('set')
  .description('Sets default settings.')
  .option('-b, --board <app/board>', 'Sets the default board.')
  .option('-c, --config <path>', 'Path to custom config file. Defaults to ~/.datanow-config.json')
  .option('-t, --token <token>', 'Token to use (Overrides config file).')
  .option('-t, --server <server>', 'Server to use (Overrides https://datanow.io).')
  .option('-l, --loglevel <level>', 'Set logging level (trace, debug, info, warn, error). Defaults to info.')
  .action(function(options) {

    setParentConfig(options.parent, config);

    var newConfig = {
      board: options.board,
      config: options.parent.config,
      token: options.parent.token,
      server: options.parent.server,
      loglevel: options.parent.loglevel,
    };

    //TODO: Remove duplicate code
    var app, board;
    if (options.board) {
      if (options.board.indexOf('/') === -1) {
        return helper.genericError('Specified board is not in the correct format (eg appName/boardName).');
      }
      var split = options.board.split('/');
      app = split[0];
      board = split[1];
      newConfig.currentApp = app;
      newConfig.currentBoard = board;
    }

    dataNow = new DataNow(config);


    dataNow.config(newConfig,
      helper.genericResponse
    );

    dataNow.save(helper.genericResponse);

  });



program.parse(process.argv);

process.on('exit', function(code) {
  if (dataNow && code == 0) {
    dataNow.save();
  }
});