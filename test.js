var _ = require('lodash')
var one = {
  'characters': [{
    'name': 'one'
  }, ]
};

var two = {
  'characters': [{
    'name': 'two'
  }, ]
};

var res = _.merge(two, one);
console.log(res);