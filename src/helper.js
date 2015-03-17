var log = require('loglevel'),
	prompt = require('prompt');

var helper = module.exports = {

	genericResponse: function (err) {
		if (err) {
			return helper.genericError(err);
		}
		log.debug('Success.');
	},

	genericJsonResponse: function (err, response) {
		if (err) {
			return helper.genericError(err);
		}
		log.info(JSON.stringify(response, null, 2));
	},

	genericError: function (err) {
		if (err instanceof Error) {
			log.error(err.message || err);
			log.debug(err.stack);
		} else {
			log.error(err);
		}
		process.exit(1);
	},

	required: function (required, config) {
		for (var i = 0; i < required.length; i++) {
			if (config[required[i]] === undefined) {
				helper.genericError('Missing required parameter: ' + required[i] + '.');
			}
		}
	},

	checkBoard: function (board) {
		if (board.indexOf('/') === -1) {
			return helper.genericError('Specified board is not in the correct format (eg appName/boardName).');
		}
	},

	promptMissingCredentials: function (program, isRegister, callback) {
		//Ask for username, email and/or password depending on what was supplied
		prompt.message = '';
		prompt.delimiter = '';
		prompt.start();
		var schema = {
			properties: {}
		};
		if (!isRegister) {
			if (!program.username && !program.email) {
				schema.properties.usernameOrEmail = {
					description: 'Enter your email:',
					required: true
				};
			}
		} else {
			if (!program.username) {
				schema.properties.username = {
					description: 'Enter your username:',
					required: isRegister,
					pattern: /^[a-zA-Z0-9]+$/,
					message: 'Username must be letters or numbers.'
				};
			}
			if (!program.email) {
				schema.properties.email = {
					description: 'Enter your email:',
					required: isRegister,
					pattern: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
					message: 'Must be a valid email address'
				};
			}
		}
		if (!program.password) {
			schema.properties.password = {
				description: 'Enter your password:',
				required: true,
				hidden: true
			};
		}

		prompt.get(schema, function (err, result) {
			if (result.usernameOrEmail) {
				if (result.usernameOrEmail.indexOf('@') === -1) {
					result.username = result.usernameOrEmail;
				} else {
					result.email = result.usernameOrEmail;
				}
			}
			var res = {
				username: result.username ? result.username : program.username,
				email: result.email ? result.email : program.email,
				password: result.password ? result.password : program.password,
			};
			callback(err, res);

		});
	},



};