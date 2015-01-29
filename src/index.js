var async = require('async'),
  log = require('loglevel'),
  path = require('path');

function DataNow(opts) {
  this.options = opts;

  log.debug('Created DataNow', opts);
}

DataNow.prototype = {

  write: function(callback) {
    log.debug('Writing');

    typeof callback === 'function' && callback();
  },

}

module.exports = DataNow;