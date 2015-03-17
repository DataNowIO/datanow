var async = require('async'),
	log = require('loglevel'),
	fs = require('fs'),
	Request = require('request'),
	path = require('path');

var request = Request.defaults({});

//TODO: Resign SSL.
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var mergeObject = function (src, target, overWriteWithNulls, preserveExisting) {
	var result = JSON.parse(JSON.stringify(target));
	var keys = Object.keys(src),
		key;
	for (var i = 0; i < keys.length; i++) {
		key = keys[i];
		if (src[key] !== null || overWriteWithNulls) {
			if (!(preserveExisting && typeof result[key] != 'undefined')) {
				result[key] = src[key];
			}
		}
	}
	return result;
}


function DataNow(opts) {
	var self = this;
	log.debug('Starting DataNow');
	self.options = opts;

	//Attempt to read the config file.
	self.options.config = self.options.config ? self.options.config : process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.datanow-config.json';
	if (fs.existsSync(self.options.config)) {
		try {
			var conf = JSON.parse(fs.readFileSync(self.options.config, 'utf8'));
			self.options = mergeObject(conf, self.options, false, true);

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

	if (self.options.token) {
		var token = self.options.token.token ? self.options.token.token : self.options.token;
		log.debug('Using token', self.options.token, token);
		request = Request.defaults({
			auth: {
				bearer: token
			}
		});
	}

	//Keep track of options changed after this point and save them to disk.
	self.optionKeysToSave = [];
}

DataNow.prototype = {

	register: function (username, email, password, callback) {
		var self = this;
		log.debug('register', username, email);

		request.put(self.options.server + '/api/me', {
				json: {
					username: username,
					email: email,
					password: password
				}
			},
			self.genericResponseHandler('register', callback)
		);
	},

	login: function (username, email, password, callback) {
		var self = this;
		log.debug('login', username, email);

		var auth = {};
		if (username) {
			auth.user = username;
		}
		if (email) {
			auth.user = email;
		}
		if (password) {
			auth.pass = password;
		}
		log.debug('login', auth);

		request.put(self.options.server + '/api/me/authorizations', {
				auth: auth,
				json: {
					appName: 'node-cli',
					scopes: ['admin']
				}
			},
			self.genericResponseHandler('login', function (err, token) {
				if (err) {
					return callback(err);
				}
				log.debug('token', token);
				self.config({
					token: token
				});
				return callback();
			})
		);
	},

	logout: function (callback) {
		var self = this;
		log.debug('logout');

		request.del(self.options.server + '/api/me/authorizations',
			self.genericResponseHandler('logout', function (err) {
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

	write: function (namespace, data, callback) {
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

	read: function (_namespace, _readOpts, _callback) {
		var self = this;

		//namespace and options are optional. Handling it.
		var namespace, readOpts, callback;
		if (arguments.length !== 3) {
			for (var i = 0; i < arguments.length; i++) {
				switch (typeof arguments[i]) {
				case 'string':
					namespace = arguments[i];
					break;
				case 'function':
					callback = arguments[i];
					break;
				case 'object':
					readOpts = arguments[i];
					break;
				}
			}
			if (typeof namespace !== 'string') {
				namespace = self.options.currentNamespace;
			}
		} else {
			namespace = _namespace;
			readOpts = _readOpts;
			callback = _callback;
		}

		var url = self.buildUrl(namespace) + '/data';
		var separator = '?';
		if (readOpts) {
			var keys = Object.keys(readOpts);
			for (var i = 0; i < keys.length; i++) {
				if (readOpts[keys[i]]) {
					url += separator + keys[i] + '=' + readOpts[keys[i]];
					separator = '&';
				}
			}
		}
		if (!(readOpts && readOpts.reverse) && self.options.reverse) {
			url += separator + 'reverse=' + self.options.reverse;
			separator = '&';
		}

		log.debug('read', url);
		request.get(url,
			self.genericResponseHandler('read', function (err, body) {
				callback(err, body);

				if (self.options.stream) {
					log.debug('stream read');
					var socket = require('socket.io-client')(self.options.server);
					socket.on('connect', function () {
						log.debug('socket connected');
					});
					socket.on(namespace, function (msg) {
						log.debug('socket got data', msg);
						if (self.options.reprintEntireData) {
							body.data = body.data.concat(msg.values);
							callback(undefined, body);
						} else {
							callback(undefined, msg);
						}
					});
					socket.on('disconnect', function () {
						log.debug('socket disconnect');
					});
				}

			})
		);
	},

	create: function (namespace, schema, autoCreateApp, callback) {
		var self = this;
		log.debug('create', namespace);

		var requestBody = {};
		if (schema) {
			requestBody.schema = schema;
		}
		request.put(self.buildUrl(namespace), {
			json: requestBody
		}, function (err, res, body) {
			if (err) {
				return callback(err);
			}
			log.debug('create response', self.buildUrl(namespace), body);

			if (self.checkForErrors(err, res, body, callback)) {
				return;
			} else {
				callback(null, body);
			}
		});
	},

	delete: function (namespace, callback) {
		var self = this;
		log.debug('remove', namespace);

		request.del(self.buildUrl(namespace), function (err, res, body) {
			if (err) {
				return callback(err);
			}
			log.debug('remove response', body);
			self.checkForErrors(err, res, body, callback);
		});
	},

	addCollaborator: function (namespace, username, callback) {
		var self = this;
		log.debug('addCollaborator', namespace, username);

		request.put(self.buildUrl(namespace) + '/collaborators/' + username, self.genericResponseHandler('addCollaborator', callback));
	},

	removeCollaborator: function (namespace, username, callback) {
		var self = this;
		log.debug('removeCollaborator', namespace, username);

		request.del(self.buildUrl(namespace) + '/collaborators/' + username, self.genericResponseHandler('removeCollaborator', callback));
	},

	getCollaborators: function (namespace, callback) {
		var self = this;
		log.debug('getCollaborators', namespace);

		request.get(self.buildUrl(namespace) + '/collaborators', self.genericResponseHandler('getCollaborators', callback));
	},

	createToken: function (namespace, scopes, options, callback) {
		var self = this;
		namespace = namespace ? namespace : self.options.currentNamespace;
		log.debug('createToken', namespace, scopes);

		var body = {};
		if (scopes.length > 0) {
			body.scopes = scopes;
		}
		body.appName = options.appName ? options.appName : 'unnamed-token';
		request.put(self.buildUrl(namespace) + '/authorizations', {
			json: body
		}, self.genericResponseHandler('createToken', callback));
	},

	updateToken: function (namespace, tokenId, scopes, options, callback) {
		var self = this;
		namespace = namespace ? namespace : self.options.currentNamespace;
		log.debug('updateToken', namespace);

		var body = {};
		if (scopes.length > 0) {
			body.scopes = scopes;
		}
		if (options.appName) {
			body.appName = options.appName;
		}
		request.post(self.buildUrl(namespace) + '/authorizations/' + tokenId, {
			json: body
		}, self.genericResponseHandler('updateToken', callback));
	},

	deleteToken: function (namespace, tokenId, callback) {
		var self = this;
		namespace = namespace ? namespace : self.options.currentNamespace;
		log.debug('deleteToken', namespace);

		request.del(self.buildUrl(namespace) + '/authorizations/' + tokenId, self.genericResponseHandler('deleteToken', callback));
	},

	getTokens: function (namespace, callback) {
		var self = this;
		namespace = namespace ? namespace : self.options.currentNamespace;
		log.debug('getTokens', namespace);

		request.get(self.buildUrl(namespace) + '/authorizations', self.genericResponseHandler('getTokens', callback));
	},

	config: function (config) {
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

	checkForErrors: function (err, res, body, callback) {
		var self = this;
		if (err) {
			callback(err);
			return true;
		}
		if (res.statusCode != 200) {
			if (typeof body == 'string') {
				try {
					body = JSON.parse(body);
				} catch (e) {}
			}
			var message = body && body.error && body.error.message ? body.error.message : 'Unknown server error.';
			log.debug(message, body);
			var e = new Error(message);
			e.status = res.status;
			callback(e);
			return true;
		}
		return false;
	},

	save: function (callback) {
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
				optionsToSave = mergeObject(optionsToSave, conf, true);
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
			fs.writeFile(self.options.config, json, fileOpts, function (err) {
				log.debug('done writing config', optionsToSave);
				callback(err);
			});
		} else {
			fs.writeFileSync(self.options.config, json, fileOpts);
			log.debug('done writing config', optionsToSave);
		}
	},

	buildUrl: function (namespace) {
		var self = this;

		var split = namespace.split('/');
		var url = self.options.server + '/api';
		url += '/user/' + split[0];
		if (typeof split[1] !== 'undefined') {
			url += '/board/' + split[1];
		}
		return url;
	},

	genericResponseHandler: function (source, callback) {
		var self = this;
		return function (err, res, body) {
			if (self.checkForErrors(err, res, body, callback)) {
				return;
			}
			log.debug(source + ' response', body);
			if (typeof body == 'string') {
				try {
					var obj = JSON.parse(body);
				} catch (e) {
					return callback(undefined, body);
				}
				return callback(undefined, obj);
			} else {
				callback(undefined, body);
			}
		};
	},


}

module.exports = DataNow;