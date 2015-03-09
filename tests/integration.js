var child_process = require('child_process'),
  should = require('should'),
  async = require('async'),
  exec = require('child_process').exec;;

describe('Integration', function() {

  before(function(doneBefore) {
    async.waterfall([
      function(waterfallDone) {
        exec('mongo DataNow --eval \"db.dropDatabase()\"', function(err) {
          waterfallDone(err);
        });
      },
      function(waterfallDone) {
        exec('npm uninstall datanow -g', function(err) {
          waterfallDone(err);
        });
      },
      function(waterfallDone) {
        exec('npm link', function(err) {
          waterfallDone(err);
        });
      },
      function(waterfallDone) {
        exec('rm -f ~/.datanow-config.json', function(err) {
          waterfallDone(err);
        });
      },
    ], doneBefore)
  });

  it('should set server', function(testDone) {

    exec('datanow set --server http://localhost:3000', function(err) {
      testDone(err);
    });
  });

  it('should set loglevel', function(testDone) {

    exec('datanow set --loglevel debug', function(err) {
      testDone(err);
    });
  });

  it('should register', function(testDone) {

    exec('datanow register --username garrows --email glen.arrowsmith@gmail.com --password g', function(err) {
      testDone(err);
    });
  });

  it('should login', function(testDone) {

    exec('datanow login --username garrows --email glen.arrowsmith@gmail.com --password g', function(err) {
      testDone(err);
    });
  });

  it('should create board', function(testDone) {

    exec('datanow create garrows/testBoard', function(err) {
      testDone(err);
    });
  });

});