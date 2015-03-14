# Real Time Ping

In this example we ping google.com and plot the results in real time.

![example plot](http://i.gyazo.com/384744035b4b9d6855a44ca4e01fbfdf.gif)

In one terminal window, create a number board, start writing ping times to the board.

```
datanow create your-username/pings number

ping -i 0.2 google.com | node -e "process.stdin.on('data', function(chunk) { var out = chunk.toString().split('time='); out[1] && console.log(out[1].substring(0, out[1].length-3)); });" | datanow write

```

Now in another terminal window, stream the data to a graph.
```
datanow read --format plot --stream
```
