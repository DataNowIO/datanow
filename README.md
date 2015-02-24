# [DataNow.io](http://datanow.io) CLI & SDK


[DataNow.io](http://datanow.io) is a simple service you can send generic data, read it back or graph it in a nice app. This is a simple command line tool and node.js SDK for interfacing with it.

## Examples

* **[Plot ping times in real time.](/docs/examples/real-time-ping.md)**
![example plot](http://i.gyazo.com/280ac40e5cfb6483b2e5ea41d3ab9187.gif)

* **[Plot Climate Data From Your House Using a Tessel](/docs/examples/tessel-climate-logger/readme.md)**

## Setup

### Install

Open a command line and run the following command to install. Requires [node.js](http://nodejs.org/download/) to be installed.
```
[sudo] npm install -g datanow
```

### Register

Register using the command below substituting in your username and email.

```
datanow register --username yourName --email you@example.com
# Enter your password
```

You will need to __click the verification link that was sent to your email__ before proceeding.

Now you can login.
```
datanow login --username yourName --email you@example.com
```
An authorization token has been generated and placed in `~/.datanow-config.json` so DataNow will remember you.

## Simple Example

First create an app and a board to post your data to.
```
datanow create test-app
datanow create test-app/test-board
datanow set --board test-app/test-board
```

Now post some numbers to it.
```
datanow write 1
datanow write 2
datanow write 3
```

Let's get those numbers back.
```
datanow read
# Prints  
#  2015-01-29T10:01:06.382Z, 1
#  2015-01-29T10:01:07.194Z, 2
#  2015-01-29T10:01:09.542Z, 3
```
You like that? Good. I was hoping you would.


## Specifying Date

Notice how in the above example you got a date back? That is because the default schema is `[ date, number ]` and if you don't supply date its is auto filled.

Let's try specifying our own date in the [ISO 8601](http://en.wikipedia.org/wiki/ISO_8601) format.
```
datanow write 2014-12-28T13:27:48.000Z 4
#   reads out as 2014-12-28T13:27:48.000Z, 4

datanow write 2014-12-29 5
#   reads out as 2014-12-29T00:00:00.000Z, 5
```


## Custom Schemas

You can specify your own schema when you create a board. Valid data types are `date`, `number` and `string`. Here are some examples.

String only
```
datanow create test-app/messages string
datanow write hello
datanow write world
datanow write 'goodbye world'
datanow read
# Prints
#  hello, world, goodbye world
```

Date, Number and String
```
datanow create test-app/weights date number string
datanow set --board test-app/weights
datanow write `date -u +"%Y-%m-%dT%H:%M:%SZ"` 130 Homer
datanow write `date -u +"%Y-%m-%dT%H:%M:%SZ"` 45 Bart
datanow read
# Prints
# 2015-02-02T14:12:45.000Z, 130, Homer
# 2015-02-02T14:12:51.000Z, 45, Bart
```

Numbers only
```
datanow create test-app/temperature number
datanow write -- -3
for i in {-3..5}
do
  datanow write -- $i
done
datanow write 5

datanow read
# Prints
# -3, -3, -2, -1, 0, 1, 2, 3, 4, 5, 5
```
Note in this example that it uses the `--`. That is a standard with command line tools for handling negative numbers as it marks end of options.


## Formatting Output

The default output option is CSV but there are a few more.

### CSV Format

CSV (comma separated values) looks nice and you can use with LibreOffice's Calc Spreadsheet program or others similar programs. Just pipe the output to a file.
```
datanow read --format csv > output.csv

# Try opening with the default program.
open output.csv
```

If you want, you can specify the delimiter as well. Lets try with spaces which could be handy if you're piping to a program like GNUPlot.
```
datanow read --format csv --delimiter ' '
# Prints
# -3 -3 -2 -1 0 1 2 3 4 5 5
```

### JSON Format

```
datanow read --format json
# Prints
# [-3,-3,-2,-1,0,1,2,3,4,5,5]

datanow read --board test-app/weights --format json
# Prints
# [["2015-02-02T14:12:45.000Z",130,"Homer"],["2015-02-02T14:12:51.000Z",45,"Bart"]]
```
That last one is a bit hard to read. Lets use the node package [json](https://npmjs.org/package/json) to make it a bit nicer.
```
sudo npm install -g json
datanow read --board test-app/weights --format json | json
# Prints
#  [
#    [
#      "2015-02-02T14:12:45.000Z",
#      130,
#      "Homer"
#    ],
#    [
#      "2015-02-02T14:12:51.000Z",
#      45,
#      "Bart"
#    ]
#  ]
```

### JS Format

This is very similar to JSON format but it prints the javascript object in shorthand which is not valid JSON.

```
datanow read --board test-app/weights --format js
# Prints
# [ [ '2015-02-02T14:12:45.000Z', 130, 'Homer' ],
#   [ '2015-02-02T14:12:51.000Z', 45, 'Bart' ] ]
```

### ASCII Plot Output

You can even plot some cool graphs in the command line with the plot format.
```
datanow read --board test-app/temperature --format plot
# Prints
#    ▲
#    │                 • •
#    │               •
#    │             •
#    │           •
#    │         •
#    ┼───────•────────────▶
#    │     •
#    │   •
#    • •
```

## Admins

You can add admin users to your apps and boards. If you add an admin to the app, they are inherently an admin on that app's boards.

Let's create a friend and test it out.
```
datanow register --username yourFriend --email yourFriend@example.com
```
Note `yourFriend` will have to click their email confirmation link before proceeding.
```
datanow update test-app --addAdmin yourFriend
datanow logout
datanow login --username yourFriend --email yourFriend@example.com
datanow create test-app/friends-board
```
See how `yourFriend` has permissions to create a new board? That's nice of you.
```
datanow update test-app --removeAdmin yourName
```
Hey! `YourFriend` just removed your admin privilages from your app. That is not very friendly but could be a completely legitimate use case.
```
datanow update test-app/test-board --addAdmin yourAcquaintance
```
Now `yourFriend` has added `yourAcquaintance` to `test-app/test-board`. At least `yourAcquaintance` doesn't have permission to create any boards in your `test-app`.


## Streaming Reads

DataNow has the ability to stream data in real time using the `--stream` flag. Try it by opening up 2 terminal windows and running this in one
```
datanow set --board test-app/temperature
datanow read --format plot --stream
```
and this in the other
```
for i in {5..15}; do   datanow write -- $i; done
```
You should see the plot updating in realtime.
![streaming example](http://i.gyazo.com/73c4636607dd275ecd21d492a466872b.gif)


## Paging, Limits & Ordering

If you only want to get the first few data points, you can impose a limit when reading using the `--limit` flag.
```
datanow read --board test-app/temperature --limit 3
# Prints -3, -3, -2
```

We call this a _page_ of data. This is most useful when dealing with large datasets. The largest and default limit you can set is 50.

To get the next page, use the `--page` flag.
```
datanow read --board test-app/temperature --limit 3 --page 2
# Prints -1, 0, 1
```

To get the latest data instead of the oldest, use the `--reverse` flag.
```
datanow read --board test-app/temperature --limit 3 --page 1 --reverse
# Prints 5, 5, 4
```

The `--reverse` flag can be very useful. If you prefer it as the default, use the `set` command.
```
datanow set --reverse true
#or
datanow set --reverse false
```
