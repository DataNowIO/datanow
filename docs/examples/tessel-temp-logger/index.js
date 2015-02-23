var tessel = require('tessel'),
  DataNow = require('datanow'),
  climatelib = require('climate-si7020');

var climate = climatelib.use(tessel.port['A']);


climate.on('ready', function() {
  console.log('Connected to si7020');

  var dataNow = new DataNow({
    // "token": "b0a985d1179d2524f93b1eb259f5fdbac33b7bef9e7f3a989e0b4e9ffa4e3e83",
    "token": "00573c1e63010a27d997ee8f4e57442bc55391373cd53db5914bf20b20725ea1",
    "server": "http://192.168.1.100:3000",
    "loglevel": "debug"
  });

  // Loop forever
  setImmediate(function loop() {
    climate.readTemperature('c', function(err, temp) {
      climate.readHumidity(function(err, humid) {
        console.log('Degrees:', temp.toFixed(4) + 'C', 'Humidity:', humid.toFixed(4) + '%RH');

        dataNow.write(
          'garrows/temp', [temp.toFixed(4)],
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
    });
  });
});

climate.on('error', function(err) {
  console.log('error connecting module', err);
});