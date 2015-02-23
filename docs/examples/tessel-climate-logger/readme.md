Firstly connect to the wifi
```
tessel wifi --network "Your WiFi Name" --password XXXXXXXXXX --security wpa2
```


Now create a board to post the temperature to.
```
datanow create yourname/climate number
```
Replace `yourname/climate` in `tessel-climate-logger.js` too.


Next get your token from `~/.datanow-config.json` remembering not to share it and put it in `tessel-climate-logger.js`.


Now run it.
```
tessel run tessel-climate-logger.js
```
