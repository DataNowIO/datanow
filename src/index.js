var async = require('async'),
  log = require('loglevel'),
  fs = require('fs'),
  _ = require('lodash'),
  Request = require('request'),
  path = require('path');

var cookieJar = Request.jar();
var request = Request.defaults({
  jar: cookieJar
});


function DataNow(opts) {
  var self = this;
  log.debug('Starting DataNow');
  self.options = opts;

  //Attempt to read the config file.
  self.options.config = self.options.config ? self.options.config : process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.datanow-config.json';
  if (fs.existsSync(self.options.config)) {
    try {
      var conf = JSON.parse(fs.readFileSync(self.options.config, 'utf8'));
      self.options = _.merge(conf, self.options);
      log.debug('Loaded config', self.options);
    } catch (e) {
      log.error('Error parsing config file.', e);
      process.exit(1);
    }
  }

  //Only modify the loglevel from warn if told to
  if (self.options.loglevel) {
    log.setLevel(self.options.loglevel);
  }

  self.options.server = self.options.server ? self.options.server : 'https://datanow.io';

  //Keep track of options changed after this point and save them to disk.
  self.optionKeysToSave = [];

  if (self.options.token) {
    log.debug('Using saved auth token');
    var cookie = request.cookie('grailed-token=' + self.options.token);
    cookieJar.setCookie(cookie, self.options.server);
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
        var token = (' ' + cookies).match(re)[1];
        log.debug('token cookies', token);
        self.config({
          token: token
        });
      }
    );
  },

  logout: function(callback) {
    var self = this;
    log.debug('logout');

    request.post(self.options.server + '/api/user/logout', function(err, res, body) {
      if (self.checkForErrors(err, res, body, callback)) {
        return;
      }

      self.config({
        token: null
      });
    });
  },

  write: function(appName, boardName, data, callback) {
    var self = this;


    //appName and boardName are optionals. Handling it.
    if (arguments.length == 2) {
      data = appName;
      callback = boardName;
      appName = self.options.currentApp;
      boardName = self.options.currentBoard;
    }
    log.debug('write', arguments.length, appName, boardName);


    request.post(self.options.server + '/api/app/' + appName + '/board/' + boardName + '/data', {
        json: {
          values: data
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

    //appName and boardName are optionals. Handling it.
    if (arguments.length == 1) {
      callback = appName;
      appName = self.options.currentApp;
      boardName = self.options.currentBoard;
    }

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

  newBoard: function(appName, boardName, schema, callback) {
    var self = this;
    log.debug('newBoard', appName);

    var options = {};
    if (schema) {
      options.schema = schema;
    }
    request.put(self.options.server + '/api/app/' + appName + '/board/' + boardName, {
        json: options
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

  config: function(config) {
    var self = this;

    var keys = Object.keys(config),
      key;
    for (var i = 0; i < keys.length; i++) {
      key = keys[i];
      if (typeof config[key] !== 'undefined') {
        self.options[key] = config[key];
        if (self.optionKeysToSave.indexOf(key) === -1) {
          log.debug('Marking', key, 'to be saved.', config[key]);
          self.optionKeysToSave.push(key);
        }
      }
    }
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

    if (self.optionKeysToSave.length === 0) {
      log.debug('Nothing to save');
      typeof callback == 'function' && callback();
      return;
    }

    //Get the options that need to be saved
    var optionsToSave = {};
    for (var i = 0; i < self.optionKeysToSave.length; i++) {
      optionsToSave[self.optionKeysToSave[i]] = self.options[self.optionKeysToSave[i]];
    }
    log.debug('Options to save', optionsToSave);

    //Get the existing options (if existing) and merge them
    if (fs.existsSync(self.options.config)) {
      try {
        var conf = JSON.parse(fs.readFileSync(self.options.config, 'utf8'));
        optionsToSave = _.merge(conf, optionsToSave);
        log.debug('Merged old config', conf, 'to', optionsToSave);
      } catch (e) {
        log.error('Error parsing config file.', e);
        process.exit(1);
      }
    }

    var json = JSON.stringify(optionsToSave);
    var fileOpts = {
      flag: 'w+'
    };
    if (typeof callback === 'function') {
      fs.writeFile(self.options.config, json, fileOpts, function(err) {
        log.debug('done writing config', optionsToSave);
        callback(err);
      });
    } else {
      fs.writeFileSync(self.options.config, json, fileOpts);
      log.debug('done writing config', optionsToSave);
    }
  }


}

module.exports = DataNow;