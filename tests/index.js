var should = require('should');

var DataNow = require('../src/index.js');

describe('DataNow', function() {

  it('should initialize', function() {
    var dataNow = new DataNow({
      loglevel: 'error'
    });
    should(dataNow).be.ok;
  });

  describe('initialized', function() {

    var dataNow;
    before(function() {
      dataNow = new DataNow({
        loglevel: 'debug'
      });
    });

    it('should write', function(testsDone) {
      dataNow.write(function(err) {
        should(err).not.exist;
        testsDone(err);
      });
    });

  });

});