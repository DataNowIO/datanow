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
  .option('-c, --config <path>', 'Path to custom config file (Defaults to ~/.datanow-config.json).')
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
  .action(function(options) {

    setParentConfig(options.parent, config);

    config.username = options.username;
    config.email = options.email;
    config.password = options.password;

    dataNow = new DataNow(config);

    helper.promptMissingCredentials(config, true, function(err, result) {
      if (err) {
        return helper.genericError(err);
      }
      dataNow.register(
        result.username,
        result.email,
        result.password,
        function(err) {
          helper.genericResponse(err);
          console.log('Please check your email before proceeding.');
        }
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
    helper.promptMissingCredentials(config, false, function(err, result) {
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
  .command('delete <app/board>')
  .description('delete a app or board.')
  .option('-y, --yes', 'Don\'t confirm.')
  .action(function(namespace, options) {

    setParentConfig(options.parent, config);

    dataNow = new DataNow(config);

    var deleteIt = function() {
      dataNow.delete(
        namespace,
        helper.genericResponse
      );
    }

    if (options.yes) {
      deleteIt();
    } else {
      var prompt = require('prompt');
      prompt.message = '';
      prompt.delimiter = '';
      prompt.start();
      var schema = {
        properties: {
          confirm: {
            pattern: /^[yYnN]+$/,
            description: 'This will delete all your data. Are you sure? [y/N]',
            message: 'y or n only please.',
            required: true
          }
        }
      }
      prompt.get(schema, function(err, result) {
        if (result.confirm.toLowerCase() == 'y') {
          deleteIt();
        }
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

    var write = function(dataArr, callback) {
      if (typeof callback != 'function') {
        callback = helper.genericResponse;
      }
      if (options.board) {
        if (options.board.indexOf('/') === -1) {
          return helper.genericError('Specified board is not in the correct format (eg appName/boardName).');
        }

        dataNow.write(
          options.board,
          dataArr,
          callback
        );
      } else {
        dataNow.write(dataArr, callback);
      }
    };

    if (typeof data == 'undefined') {

      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      process.stdin.on('data', function(chunk) {

        write([chunk], function(err) {
          if (err) {
            return helper.genericError(err);
          }
          log.info('Wrote', chunk.toString().trim());
        });
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
  .option('-s, --stream', 'Stream data in real time.')
  .option('-l, --limit <number>', 'Limit of items returned per page (Max & default is 50).')
  .option('-p, --page <number>', 'Page number to continue from when reading paged data. (ie. Page 1 is the latest data)')
  .option('-r, --reverse [true|false]', 'Reverse the dataset on reads (Newest first).')
  .option('-d, --delimiter <delimiter>', 'Output format (eg. csv, json, js, plot). Defaults to csv.')
  .action(function(options) {

    setParentConfig(options.parent, config);

    config.stream = options.stream;
    if (options.format == 'plot') {
      config.reprintEntireData = true;
    }

    dataNow = new DataNow(config);

    var readOpts = {}
    readOpts.limit = options.limit ? options.limit : undefined;
    readOpts.page = options.page ? options.page : undefined;
    readOpts.reverse = options.reverse ? options.reverse : undefined;

    if (options.board) {
      helper.checkBoard(options.board);

      dataNow.read(options.board, readOpts, formatter.dataResponse.bind(formatter, options));
    } else {
      dataNow.read(readOpts, formatter.dataResponse.bind(formatter, options));
    }
  });



program
  .command('set')
  .description('Sets default settings.')
  .option('-b, --board <app/board>', 'Sets the default board.')
  .option('-r, --reverse [true|false]', 'Reverse the dataset on reads (Newest first).')
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

    if (options.reverse) {
      try {
        //Converts 'false' or '0'
        newConfig.reverse = JSON.parse(options.reverse);
      } catch (e) {
        log.error('Unknown --reverse value. Try "true" or "false".');
        process.exit(1);
      }
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