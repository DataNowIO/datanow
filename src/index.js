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
    var cookie = request.cookie('user-token=' + self.options.token);
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
      self.genericResponseHandler('register', function(err) {
        if (login && !err) {
          return self.login(username, email, password, callback);
        } else {
          return callback(err);
        }
      })
    );
  },

  login: function(username, email, password, callback) {
    var self = this;
    log.debug('login', username, email);

    var requestBody = {};
    if (username) {
      requestBody.username = username;
    }
    if (email) {
      requestBody.email = email;
    }
    if (password) {
      requestBody.password = password;
    }
    log.debug('login', requestBody);

    request.post(self.options.server + '/api/user/login', {
        json: requestBody
      },
      self.genericResponseHandler('login', function(err) {
        if (err) {
          return callback(err);
        }
        var cookies = cookieJar.getCookieString(self.options.server);
        var re = new RegExp('[; ]user-token=([^\\s;]*)');
        var token = (' ' + cookies).match(re)[1];
        log.debug('token cookies', token);
        self.config({
          token: token
        });
        return callback();
      })
    );
  },

  logout: function(callback) {
    var self = this;
    log.debug('logout');

    request.post(self.options.server + '/api/user/logout',
      self.genericResponseHandler('logout', function(err) {
        if (err) {
          return callback(err);
        }
        self.config({
          token: null
        });
        return callback();
      })
    );
  },

  write: function(namespace, data, callback) {
    var self = this;

    //namespace is optional. Handling it.
    if (arguments.length == 2) {
      callback = data;
      data = namespace;
      namespace = self.options.currentNamespace;
    }
    log.debug('write', namespace, data);

    request.post(self.buildUrl(namespace) + '/data', {
        json: {
          values: data
        }
      },
      self.genericResponseHandler('write', callback)
    );
  },

  read: function(namespace, callback) {
    var self = this;
    log.debug('read', namespace);

    //namespace is optional. Handling it.
    if (arguments.length == 1) {
      callback = namespace;
      namespace = self.options.currentNamespace;
    }

    request.get(self.buildUrl(namespace) + '/data',
      self.genericResponseHandler('read', function(err, body) {
        callback(err, body.data);
      })
    );
  },

  create: function(namespace, schema, autoCreateApp, callback) {
    var self = this;
    log.debug('create', namespace);

    var requestBody = {};
    if (schema) {
      requestBody.schema = schema;
    }
    request.put(self.buildUrl(namespace), {
      json: requestBody
    }, function(err, res, body) {
      if (err) {
        return callback(err);
      }
      log.debug('create response', body);
      //Check the auto create app feature & conditions
      if (autoCreateApp && res.statusCode == 404 && namespace.indexOf('/') != -1) {
        log.debug('App not found, auto creating');
        //Create the app
        var appNamespace = namespace.split('/')[0];
        self.create(appNamespace, null, false, function(err) {
          if (err) {
            return callback(err);
          }
          log.debug('Created app. Creating board', namespace);
          //Retry creating the board
          return self.create(namespace, schema, false, callback);
        });
      } else if (self.checkForErrors(err, res, body, callback)) {
        return;
      } else {
        callback(null, body);
      }
    });
  },

  addAdmin: function(namespace, username, callback) {
    var self = this;
    log.debug('addAdmin', namespace);

    request.put(self.buildUrl(namespace) + '/admins', {
      json: {
        username: username
      }
    }, self.genericResponseHandler('addAdmin', callback));
  },

  removeAdmin: function(namespace, username, callback) {
    var self = this;
    log.debug('removeAdmin', namespace);

    request.del(self.buildUrl(namespace) + '/admins', {
      json: {
        username: username
      }
    }, self.genericResponseHandler('removeAdmin', callback));
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
  },

  buildUrl: function(namespace) {
    var self = this;

    var split = namespace.split('/');
    var url = self.options.server + '/api';
    url += '/app/' + split[0];
    if (typeof split[1] !== 'undefined') {
      url += '/board/' + split[1];
    }
    return url;
  },

  genericResponseHandler: function(source, callback) {
    var self = this;
    return function(err, res, body) {
      if (self.checkForErrors(err, res, body, callback)) {
        return;
      }
      log.debug(source + ' response', body);
      if (typeof body == 'string') {
        try {
          var obj = JSON.parse(body);
          callback(undefined, obj);
        } catch (e) {
          callback(undefined, body);
        }
      } else {
        callback(undefined, body);
      }
    };
  },


}

module.exports = DataNow;
