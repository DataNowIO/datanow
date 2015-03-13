var child_process = require('child_process'),
	should = require('should'),
	async = require('async'),
	exec = require('child_process').exec;;

describe('Integration', function () {

	var now = (new Date()).toISOString();

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
			var collaborators = JSON.parse(output);
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
				var collaborators = JSON.parse(output);
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

});