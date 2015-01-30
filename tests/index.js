var should = require('should'),
  nock = require('nock');

var username = 'homer',
  email = 'homer@simpsons.com',
  password = 'password',
  appName = 'testApp',
  boardName = 'testBoard';

var server = nock('https://datanow.io')
  .post('/api/user/register')
  .reply(200, {
    username: username,
    email: email
  })
  .put('/api/app/' + appName)
  .reply(200, {
    appId: appName
  })
  .put('/api/app/' + appName + '/board/' + boardName)
  .reply(200, {
    boardId: boardName
  })
  .post('/api/app/' + appName + '/board/' + boardName + '/data')
  .reply(200, {
    boardId: boardName
  })
  .get('/api/app/' + appName + '/board/' + boardName + '/data')
  .reply(200, {
    boardId: boardName,
    data: [
      [(new Date(Date.now() - 2000)).toISOString(), 1],
      [(new Date(Date.now() - 1000)).toISOString(), 2],
      [(new Date(Date.now())).toISOString(), 3],
    ]
  })




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

    it('should register', function(testsDone) {
      dataNow.register(username, email, password, function(err) {
        should(err).not.exist;
        testsDone(err);
      });
    });

    it('should create app', function(testsDone) {
      dataNow.newApp(appName, function(err) {
        should(err).not.exist;
        testsDone(err);
      });
    });

    it('should create board', function(testsDone) {
      dataNow.newBoard(appName, boardName, function(err) {
        should(err).not.exist;
        testsDone(err);
      });
    });

    it('should write data', function(testsDone) {
      dataNow.write(appName, boardName, 1, function(err) {
        should(err).not.exist;
        testsDone(err);
      });
    });

    it('should read data', function(testsDone) {
      dataNow.read(appName, boardName, function(err, data) {
        should(err).not.exist;
        testsDone(err);
        should(data).be.ok;
      });
    });

  });

});