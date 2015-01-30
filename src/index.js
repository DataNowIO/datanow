var async = require('async'),
  log = require('loglevel'),
  fs = require('fs'),
  Request = require('request'),
  path = require('path');

var cookieJar = Request.jar();
var request = Request.defaults({
  jar: cookieJar
});


function DataNow(opts) {
  log.debug('Starting DataNow');
  this.options = opts;

  this.options.server = this.options.server ? this.options.server : 'https://datanow.io';
  if (this.options.token) {
    log.debug('Using saved token', this.options.token);
    var cookie = request.cookie('grailed-token=' + this.options.token);
    cookieJar.setCookie(cookie, this.options.server);
  }

}

DataNow.prototype = {

  register: function(username, email, password, login, callback) {
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
        log.debug('Register body', body);
        if (login) {
          return self.login(username, email, password, callback);
        } else {
          return callback();
        }
      }
    );
  },

  login: function(username, email, password, callback) {
    var self = this;
    log.debug('login', username, email);

    request.post(self.options.server + '/api/user/login', {
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

        var cookies = cookieJar.getCookieString(self.options.server);
        // log.debug('login body', body);
        var re = new RegExp('[; ]grailed-token=([^\\s;]*)');
        self.options.token = (' ' + cookies).match(re)[1];
        log.debug('token cookies', self.options.token);
        self.save(callback);
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

  save: function(callback) {
    var self = this;
    var json = JSON.stringify(self.options);
    fs.writeFile(self.options.config, json, {
      flag: 'w+'
    }, function(err) {
      log.debug('done writing config', self.options.config, err);
      callback(err);
    });
  }


}

module.exports = DataNow;