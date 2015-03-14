# Plot Climate Data From Your House Using a Tessel

A [Tessel](tessel.io) is a wonderfully simple microcontroller with WiFi and simple modules. This example uses the climate module to collect temperature data and plot it in real time.

<img src="https://s3.amazonaws.com/technicalmachine-assets/technical-io/tessel-red-usb.jpg" alt="Tessel" style="width:200px;">

If you haven't used your Tessel before, go through these tutorials first. (Est 10min)

1. [Setup & Install Tessel](http://start.tessel.io/install)

2. [Connect Tessel to Wifi](http://start.tessel.io/wifi)

3. [Climate Module](http://start.tessel.io/modules/climate)


You should have done this before but if not, connect the tessel to the wifi.
```
tessel wifi --network "Your WiFi Name" --password XXXXXXXXXX --security wpa2
```

If you haven't done this already, install datanow, register and/or login.
```
[sudo] npm install -g datanow
datanow register
#Click the authorization link in your email before proceeding.
datanow login
```

Download the [tessel-climate-logger.js](./tessel-climate-logger.js) example into a file and save it.

Now create a board to post the temperature to replacing `your-username`.
```
datanow create your-username/climate number
```
Replace `your-username/climate` in `tessel-climate-logger.js` too.


DataNow stores an authentication token in a config file after logging in. We are going to use that auth token in the code so we don't have to login in the code.
Copy the long string of characters.
```
sudo npm install -g json
cat ~/.datanow-config.json | json token.token
```
Replace the long string of `xxxxx`s in `tessel-climate-logger.js` with the `user-token` field you just copied. Remember not to share it with anyone else.


Now run it.
```
tessel run tessel-climate-logger.js
```
You can also push it so it will run even if its not connected to a computer.
```
tessel push tessel-climate-logger.js
```

Take a look at your graph.
```
dn read --stream --format plot
```
