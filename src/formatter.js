var log = require('loglevel'),
  _ = require('lodash');

var helper = module.exports = {

  dataResponse: function(options, err, board) {
    if (err) {
      log.error(err.message || err);
      log.debug(err.stack);
      process.exit(1);
    }
    if (typeof options.format == 'undefined') {
      options.format = 'csv';
    }
    if (typeof this[options.format] !== 'function') {
      log.warn('Unknown format. Defaulting to csv.');
      options.format = 'csv';
    }

    this[options.format](board, options);
  },

  json: function(board, options) {
    var data = board.data;
    console.log(JSON.stringify(data));
  },

  js: function(board, options) {
    var data = board.data;
    console.log(data);
  },

  csv: function(board, options) {

    function doCsv(data) {
      if (data instanceof Array) {
        for (var i = 0; i < data.length; i++) {
          doCsv(data[i]);
          if (data[i] instanceof Array) {
            console.log();
          } else if (i < data.length - 1) {
            process.stdout.write(options.delimiter || ', ');
          }
        }
      } else {
        var str = data.toString();
        if (/[\n,"]/.test(str)) {
          process.stdout.write('"' + str + '"');
        } else {
          process.stdout.write(str);
        }
      }
    }

    doCsv(board.data);
    console.log();
  },

  plot: function(board, options) {
    var data = board.data;
    var CliGraph = require("cli-graph");

    if (_.isEqual(board.schema, ['number'])) {
      var max = _.max(data);
      var min = _.min(data);
      var height, centerY;
      if (min > 0) {
        height = max + 2;
        centerY = height - 1;
      } else {
        height = max - min + 2;
        centerY = height + min - 1;
      }

      var g1 = new CliGraph({
        height: height,
        width: data.length,
        center: {
          x: 0,
          y: centerY
        }
      }).setFunction(function(x) {
        if (x < 0) return null;

        return data[x];
      });
      console.log(g1.toString());
    } else {
      log.error('The board schema isn\'t supported for plotting at the moment.')
    }
  },

};