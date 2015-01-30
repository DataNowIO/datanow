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
    log.debug('register', username, email);

    request.post(self.options.server + '/api/user/register', {
        json: {
          username: username,
          email: email,
          password: password
        }
      },
      function(err, res, body) {
        if (self.checkForErrors(err, res, body, callback)) {
          return;
        }
        log.debug('Register response', body);
        callback();
      }
    );
  },

  write: function(appName, boardName, data, callback) {
    var self = this;
    log.debug('write', appName, boardName);

    request.post(self.options.server + '/api/app/' + appName + '/board/' + boardName + '/data', {
        json: {
          value: data
        }
      },
      function(err, res, body) {
        if (self.checkForErrors(err, res, body, callback)) {
          return;
        }
        log.debug('write response', body);
        callback();
      }
    );
  },

  read: function(appName, boardName, callback) {
    var self = this;
    log.debug('read', appName, boardName);

    request.get(self.options.server + '/api/app/' + appName + '/board/' + boardName + '/data', {
        json: {}
      },
      function(err, res, body) {
        if (self.checkForErrors(err, res, body, callback)) {
          return;
        }
        log.debug('read response', body);
        callback(null, body.data);
      }
    );
  },

  newApp: function(appName, callback) {
    var self = this;
    log.debug('newApp', appName);

    request.put(self.options.server + '/api/app/' + appName, {
        json: {}
      },
      function(err, res, body) {
        if (self.checkForErrors(err, res, body, callback)) {
          return;
        }
        log.debug('newApp response', body);
        callback();
      }
    );
  },

  newBoard: function(appName, boardName, callback) {
    var self = this;
    log.debug('newBoard', appName);

    request.put(self.options.server + '/api/app/' + appName + '/board/' + boardName, {
        json: {}
      },
      function(err, res, body) {
        if (self.checkForErrors(err, res, body, callback)) {
          return;
        }
        log.debug('newBoard response', body);
        callback();
      }
    );
  },

  checkForErrors: function(err, res, body, callback) {
    var self = this;
    if (err) {
      callback(err);
      return true;
    }
    if (res.statusCode != 200) {
      var e = new Error('Unknown server error.');
      e.message = body && body.error && body.error.message ? body.error.message : e.message;
      e.status = res.status;
      callback(e);
      return true;
    }
    return false;
  },


}

module.exports = DataNow;