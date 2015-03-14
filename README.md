# [DataNow.io](http://datanow.io) CLI & SDK


[DataNow.io](http://datanow.io) is a simple service you can send generic data, read it back or graph it in a nice app. This is a simple command line tool and node.js SDK for interfacing with it.

## Examples

* **[Plot Climate Data From Your House Using a Tessel](/docs/examples/tessel-climate-logger/readme.md)**

* **[Plot Ping Latency in Real Time.](/docs/examples/real-time-ping.md)**
![example plot](http://i.gyazo.com/384744035b4b9d6855a44ca4e01fbfdf.gif)


## Setup

### Install

Open a command line and run the following command to install. Requires [node.js](http://nodejs.org/download/) to be installed.
```
[sudo] npm install -g datanow
```

### Register

Register using the command below substituting in your username and email.

```
datanow register --username your-username --email your-username@example.com
# Enter your password
```

You will need to __click the verification link that was sent to your email__ before proceeding.

Now you can login.
```
datanow login --username your-username --email your-username@example.com
```
An authorization token has been generated and placed in `~/.datanow-config.json` so DataNow will remember you.

## Simple Example

First create an app and a board to post your data to.
```
datanow create your-username/test-board
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
datanow create your-username/messages string
datanow write hello
datanow write world
datanow write 'goodbye world'
datanow read
# Prints
#  hello
#  world
#  goodbye world
```

Date, Number and String
```
datanow create your-username/weights date number string
datanow set --board your-username/weights
datanow write `date -u +"%Y-%m-%dT%H:%M:%SZ"` 130 Homer
datanow write `date -u +"%Y-%m-%dT%H:%M:%SZ"` 45 Bart
datanow read
# Prints
# 2015-02-02T14:12:45.000Z, 130, Homer
# 2015-02-02T14:12:51.000Z, 45, Bart
```

Numbers only
```
datanow create your-username/temperature number
datanow write -- -3
for i in {-3..5}
do
  datanow write -- $i
done
datanow write 5

datanow read
# Prints
#  -3
#  -3
#  -2
#  -1
#  0
#  1
#  2
#  3
#  4
#  5
#  5

datanow read --board your-username/weights
# Prints
#  2015-03-13T07:49:09.000Z, 130, Homer
#  2015-03-13T07:49:09.000Z, 45, Bart
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

Specify the line delimiter and the column delimiter with `--lineDelimiter` and `--delimiter`. Very handy for piping to other tools like GNUPlot.
```
datanow read --format csv --lineDelimiter ', '
# Prints
# -3, -3, -2, -1, 0, 1, 2, 3, 4, 5, 5,

datanow read --board your-username/weights --delimiter $'\t'
# Prints
# 2015-03-13T07:49:09.000Z	130	Homer
# 2015-03-13T07:49:09.000Z	45	Bart
```

### JSON Format

```

datanow read --board your-username/weights --format json
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
datanow read --board your-username/weights --format js
# Prints
# [ [ '2015-02-02T14:12:45.000Z', 130, 'Homer' ],
#   [ '2015-02-02T14:12:51.000Z', 45, 'Bart' ] ]
```

### ASCII Plot Output

You can even plot some cool graphs in the command line with the plot format.
```
datanow read --board your-username/temperature --format plot --height 10 --width 80
# Prints
#  ▲
#  │                 • •
#  │
#  │               •
#  │
#  │             •
#  │
#  │           •
#  │
#  │         •
#  │
#  ┼───────•────────────▶
#  │
#  │     •
#  │
#  │   •
#  │
#  • •
#  
#  Max=5 Min=-3 Mean=1 Last=5
```
If you exclude the `--height` & `--width`, it will default to the size of your terminal window. Very useful when streaming large datasets.

## Collaborators

You can add collaborators to your boards which get administrative privileges.

Let's create a friend and test it out.
```
datanow register --username friends-name --email friends-name@example.com
```
Note `friends-name` will have to click their email confirmation link before proceeding.
```
datanow collaborators your-username/temperature --add friends-name
datanow logout
datanow login --username friends-name --email friends-name@example.com
datanow write --board your-username/temperature 7
```
See how `friends-name` has permissions to write to your temperature board? That's nice of you.
```
datanow collaborators your-username/temperature --remove your-username
```
Hey! `friends-name` just removed you as a collaborators from your board. That is not very friendly but could be a completely legitimate use case.


## Streaming Reads

DataNow has the ability to stream data in real time using the `--stream` flag. Try it by opening up 2 terminal windows and running this in one
```
datanow read --board your-username/temperature --format plot --height 10 --width 80 --stream
```
and this in the other
```
for i in {5..-3}; do   datanow write -- $i; done
```
You should see the plot updating in realtime.
![streaming example](http://i.gyazo.com/fd240ab9d7322a9d94531be0749cc55c.gif)


## Paging, Limits & Ordering

If you only want to get the first few data points, you can impose a limit when reading using the `--limit` flag.
```
datanow create your-username/counting number
for i in {0..10}; do   datanow write -- $i; done

datanow read --limit 3
# Prints
#  0
#  1
#  2
```

We call this a _page_ of data. This is most useful when dealing with large datasets. The largest and default limit you can set is 50.

To get the next page, use the `--page` flag.
```
datanow read --limit 3 --page 2
# Prints
#  3
#  4
#  5
```

To get the latest data instead of the oldest, use the `--reverse` flag.
```
datanow read --limit 3 --page 1 --reverse
# Prints
#  10
#  9
#  8
```

The `--reverse` flag can be very useful. If you prefer it as the default, use the `set` command.
```
datanow set --reverse true
#or
datanow set --reverse false
```
