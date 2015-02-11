var log = require('loglevel');

var helper = module.exports = {

  dataResponse: function(options, err, data) {
    if (err) {
      return helper.genericError(err);
    }
    if (typeof options.format == 'undefined') {
      options.format = 'json';
    }
    if (typeof this[options.format] !== 'function') {
      log.warn('Unknown format. Defaulting to json.');
      options.format = 'json';
    }
    this[options.format](data, options);
  },

  json: function(data, options) {
    console.log(data);
  },

  csv: function(data, options) {
    if (data instanceof Array) {
      for (var i = 0; i < data.length; i++) {
        this.csv(data[i], options);
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



};