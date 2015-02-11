#!/usr/bin/env node

var program = require('commander'),
  log = require('loglevel'),
  async = require('async'),
  helper = require('../src/helper.js'),
  formatter = require('../src/formatter.js'),
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
  .option('-F, --dontForce', 'Don\'t force auto creation of the app if it doesn\'t exist')
  .action(function(namespace, schema, options) {

    setParentConfig(options.parent, config);

    dataNow = new DataNow(config);

    var force = !options.dontForce;
    dataNow.create(
      namespace,
      schema.length > 0 ? schema : null,
      force,
      helper.genericResponse
    );

    if (typeof options.dontUse == 'undefined') {
      dataNow.config({
        currentNamespace: namespace
      });
    }

  });


program
  .command('update <app/board>')
  .description('Add or remove a board\'s admin.')
  .option('-a, --addAdmin <username>', 'Authorize a user as an admin to this app or board.')
  .option('-r, --removeAdmin <username>', 'Deauthorize a user as an admin to this app or board.')
  .action(function(namespace, options) {

    setParentConfig(options.parent, config);

    dataNow = new DataNow(config);

    async.parallel([
      function(done) {
        if (options.addAdmin) {
          dataNow.addAdmin(namespace, options.addAdmin, done);
        } else {
          done();
        }
      },
      function(done) {
        if (options.removeAdmin) {
          dataNow.removeAdmin(namespace, options.removeAdmin, done);
        } else {
          done();
        }
      }
    ], helper.genericResponse);

  });


program
  .command('write [data] [moreData...]')
  .description('Write data to a board (string, date, number).')
  .option('-b, --board <app/board>', 'Override the current board.')
  .action(function(data, moreData, options) {

    setParentConfig(options.parent, config);

    dataNow = new DataNow(config);

    var write = function(dataArr) {
      if (options.board) {
        if (options.board.indexOf('/') === -1) {
          return helper.genericError('Specified board is not in the correct format (eg appName/boardName).');
        }

        dataNow.write(
          options.board,
          dataArr,
          helper.genericResponse
        );
      } else {
        dataNow.write(dataArr, helper.genericResponse);
      }
    };

    if (typeof data == 'undefined') {

      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      process.stdin.on('data', function(chunk) {
        write([chunk]);
      });

      process.stdin.on('end', function() {
        log.debug('Ended stdin stream.');
      });
    } else {
      moreData.splice(0, 0, data);
      write(moreData);
    }
  });


program
  .command('read')
  .description('Read data from a board.')
  .option('-b, --board <app/board>', 'Override the current board.')
  .option('-f, --format <format>', 'Output format (csv, json).')
  .option('-d, --delimiter <delimiter>', 'Output format (csv, json).')
  .action(function(options) {

    setParentConfig(options.parent, config);

    dataNow = new DataNow(config);

    if (options.board) {
      helper.checkBoard(options.board);

      dataNow.read(options.board, formatter.dataResponse.bind(formatter, options));
    } else {
      dataNow.read(formatter.dataResponse.bind(formatter, options));
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
      config: options.parent.config,
      token: options.parent.token,
      server: options.parent.server,
      loglevel: options.parent.loglevel,
    };

    if (options.board) {
      helper.checkBoard(options.board);
      newConfig.currentNamespace = options.board;
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