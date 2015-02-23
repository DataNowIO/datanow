var DataNow = require('datanow')

var dataNow = new DataNow({
  "token": "b0a985d1179d2524f93b1eb259f5fdbac33b7bef9e7f3a989e0b4e9ffa4e3e83", //prod
  // "token": "00573c1e63010a27d997ee8f4e57442bc55391373cd53db5914bf20b20725ea1",
  // "server": "http://localhost:3000"
});

// Loop forever
setImmediate(function loop() {

  dataNow.write(
    'garrows/temp', [32],
    function(err, res) {
      if (err) {
        console.log('Failed writing to datanow', err.stack);
      } else {
        console.log('Success.', res);
      }
      setTimeout(loop, 1000);
    }
  );

});