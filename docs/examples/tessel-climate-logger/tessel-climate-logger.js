var tessel = require('tessel'),
  DataNow = require('datanow'),
  climatelib = require('climate-si7020');

var climate = climatelib.use(tessel.port['A']);


climate.on('ready', function() {
  console.log('Connected to si7020');

  var dataNow = new DataNow({
    // Get the token from ~/.datanow-config.json (Remember not to share it).
    token: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  });

  // Loop forever
  setImmediate(function loop() {
    climate.readTemperature('c', function(err, temp) {
      climate.readHumidity(function(err, humid) {
        console.log('Degrees:', temp.toFixed(4) + 'C', 'Humidity:', humid.toFixed(4) + '%RH');

        dataNow.write(
          'yourname/climate', [temp.toFixed(4)],
          function(err, res) {
            if (err) {
              console.log('Failed writing to datanow', err.stack);
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