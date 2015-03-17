var child_process = require('child_process'),
	should = require('should'),
	async = require('async'),
	path = require('path'),
	fs = require('fs'),
	exec = require('child_process').exec;

describe('Integration', function () {
	this.timeout(6000);

	var now = (new Date()).toISOString(),
		authToken,
		createToken;

	before(function (doneBefore) {
		async.waterfall([
			function (waterfallDone) {
				exec('mongo DataNow --eval \"db.dropDatabase()\"', function (err, output) {
					waterfallDone(err);
				});
			},
			function (waterfallDone) {
				exec('npm uninstall datanow -g', function (err, output) {
					waterfallDone(err);
				});
			},
			function (waterfallDone) {
				exec('npm link', function (err, output) {
					waterfallDone(err);
				});
			},
			function (waterfallDone) {
				exec('rm -f ~/.datanow-config.json', function (err, output) {
					waterfallDone(err);
				});
			},
		], doneBefore)
	});

	it('should set server', function (testDone) {

		exec('datanow set --server http://localhost:3000', function (err, output) {
			testDone(err);
		});
	});

	it('should register homer', function (testDone) {

		exec('datanow register --username homer --email glen+homer@datanow.io --password password1', function (err, output) {
			testDone(err);
		});
	});

	it('should register marge', function (testDone) {

		exec('datanow register --username marge --email glen+marge@datanow.io --password password2', function (err, output) {
			testDone(err);
		});
	});

	it('should login', function (testDone) {

		exec('datanow login --username homer --email glen+homer@datanow.io --password password1', function (err, output) {
			var configPath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.datanow-config.json';
			var config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
			config.token.should.be.object;
			config.token.token.should.be.ok;
			authToken = config.token.token;
			testDone(err);
		});
	});

	it('should create board', function (testDone) {

		exec('datanow create homer/test-board', function (err, output) {
			testDone(err);
		});
	});

	it('should add marge to the collaborators', function (testDone) {

		exec('datanow collaborators homer/test-board --add marge', function (err, output) {
			testDone(err);
		});
	});

	it('should list the collaborators', function (testDone) {

		exec('datanow collaborators homer/test-board --list', function (err, output) {
			try {
				var collaborators = JSON.parse(output);
			} catch (e) {
				console.log('Invalid json', output);
				should(e).not.be.ok;
			}
			collaborators.should.be.instanceof(Array);
			collaborators.length.should.eql(2);
			collaborators[0].username.should.eql('homer');
			collaborators[1].username.should.eql('marge');
			testDone(err);
		});
	});

	it('should remove marge from the collaborators', function (testDone) {

		exec('datanow collaborators homer/test-board --remove marge', function (err, output) {
			should(err).not.be.ok;
			exec('datanow collaborators homer/test-board --list', function (err, output) {
				try {
					var collaborators = JSON.parse(output);
				} catch (e) {
					console.log('Invalid json', output);
					should(e).not.be.ok;
				}
				collaborators.should.be.instanceof(Array);
				collaborators.length.should.eql(1);
				collaborators[0].username.should.eql('homer');
				testDone(err);
			});
		});
	});

	it('should write data to the board', function (testDone) {

		exec('datanow write ' + now + ' 1', function (err, output) {
			testDone(err);
		});
	});

	it('should read data to the board', function (testDone) {

		exec('datanow read --format json', function (err, output) {
			var data = JSON.parse(output);
			data.should.be.instanceof(Array);
			data.should.eql([
				[now, 1]
			]);
			testDone(err);
		});
	});

	it('should logout', function (testDone) {

		exec('datanow logout', function (err, output) {
			testDone(err);
		});
	});

	it('should fail writing data when logged out', function (testDone) {

		exec('datanow write ' + now + ' 1', function (err, output) {
			should(err).be.ok;
			testDone();
		});
	});

	it('should fail writing data when using an invalidated token', function (testDone) {
		exec('datanow write ' + now + ' 1 --token ' + authToken, function (err, output) {
			should(err).be.ok;
			testDone();
		});
	});

	it('should login again', function (testDone) {

		exec('datanow login --username homer --email glen+homer@datanow.io --password password1', function (err, output) {
			var configPath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.datanow-config.json';
			var config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
			config.token.should.be.object;
			config.token.token.should.be.ok;
			authToken = config.token.token;
			testDone(err);
		});
	});

	it('should create board token', function (testDone) {

		exec('datanow tokens --create --appName unit-test admin', function (err, output) {
			var out = JSON.parse(output);
			should(out).be.instanceOf(Object);
			out.appName.should.eql('unit-test');
			out.scopes.should.eql(['admin']);
			createToken = out;
			testDone(err);
		});
	});

	it('should have 1 board token', function (testDone) {

		exec('datanow tokens --list', function (err, output) {
			var out = JSON.parse(output);
			should(out).be.instanceOf(Array);
			out.length.should.eql(1);
			testDone(err);
		});
	});

	it('should fail creating a token using the board token', function (testDone) {

		exec('datanow tokens --create --appName fail-test --token ' + createToken.token + 'create ', function (err, output) {
			should(err).be.ok;
			testDone();
		});
	});

	it('should write data using the board token', function (testDone) {

		exec('datanow write --token ' + createToken.token + ' 9', function (err, output) {
			testDone(err);
		});
	});

	it('should update board token', function (testDone) {

		exec('datanow tokens --update ' + createToken.id + ' --appName unit-test-two create read', function (err, output) {
			try {
				var out = JSON.parse(output);
			} catch (e) {
				console.log('Invalid json', output);
				should(e).not.be.ok;
			}
			should(out).be.instanceOf(Object);
			out.appName.should.eql('unit-test-two');
			out.scopes.should.eql(['create', 'read']);
			testDone(err);
		});
	});

	it('should delete board token', function (testDone) {

		exec('datanow tokens --delete ' + createToken.id, function (err, output) {
			testDone(err);
		});
	});

	it('should have 0 board token', function (testDone) {

		exec('datanow tokens --list', function (err, output) {
			var out = JSON.parse(output);
			should(out).be.instanceOf(Array);
			out.length.should.eql(0);
			testDone(err);
		});
	});


});