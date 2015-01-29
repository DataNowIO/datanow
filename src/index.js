var async = require('async'),
  log = require('loglevel'),
  request = require('request'),
  path = require('path');

function DataNow(opts) {
  this.options = opts;

  this.options.server = this.options.server ? this.options.server : 'https://datanow.io';

  log.debug('Created DataNow');
}

DataNow.prototype = {

  register: function(username, email, password, callback) {
    var self = this;
    log.debug('register', self.options.server, username, email, password);

    request.post(self.options.server + '/api/user/register', {
        json: {
          username: username,
          email: email,
          password: password
        }
      },
      function(err, res, body) {
        if (err) {
          return callback(err);
        }
        if (res.status != 200) {
          var e = new Error('Unknown server error.');
          e.message = body && body.error && body.error.message ? body.error.message : e.message;
          e.status = res.status;
          return callback(e);
        }
        log.debug('Register response', body);
        callback();
      }
    );
  },

  write: function(callback) {
    var self = this;
    log.debug('write');

    callback();
  },

  read: function(callback) {
    var self = this;
    log.debug('read');

    callback();
  },

  newApp: function(callback) {
    var self = this;
    log.debug('newApp');

    callback();
  },

  newBoard: function(callback) {
    var self = this;
    log.debug('newBoard');

    callback();
  },


}

module.exports = DataNow;