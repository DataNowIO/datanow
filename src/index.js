var async = require('async'),
  log = require('loglevel'),
  request = require('request'),
  path = require('path');

function DataNow(opts) {
  this.options = opts;

  this.options.server = this.options.server ? this.options.server : 'https://datanow.io';

  log.debug('Created DataNow');
}

DataNow.prototype = {

  register: function(username, email, password, callback) {
    var self = this;
    log.debug('register');



    callback();
  },

  write: function(callback) {
    var self = this;
    log.debug('write');

    callback();
  },

  write: function(callback) {
    var self = this;
    log.debug('write');

    callback();
  },

  read: function(callback) {
    var self = this;
    log.debug('read');

    callback();
  },

  newApp: function(callback) {
    var self = this;
    log.debug('newApp');

    callback();
  },

  newBoard: function(callback) {
    var self = this;
    log.debug('newBoard');

    callback();
  },


}

module.exports = DataNow;