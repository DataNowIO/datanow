# [DataNow.io](http://datanow.io) CLI & SDK


[DataNow.io](http://datanow.io) is a simple hosted service you can send generic data, read it back or graph it in a nice app. This is a simple command line tool and node.js SDK for interfacing with it.

## Setup

### Install

Open a command line and run the following command to install. Requires [node.js](http://nodejs.org/download/) to be installed.
```
[sudo] npm install -g datanow
```

### Register

Register using the command below substituting in your username and email.

```
datanow --register --username garrows --email glen@datanow.io
```

Enter your password when prompted. An authorization token has been generated and placed in `~/.datanow/config.json`. You will need to __click the verification link that was sent to your email__ before proceeding.


## Simple Example

First create a board to post your data to.
```
datanow --newBoard test-board
```

Now post some numbers to it.
```
datanow --board test-board --write 1
datanow --board test-board --write 2
datanow --board test-board --write 3
```

Let's get those numbers back.
```
datanow --board test-board --read
# prints  
# [
#   [ '2015-01-29T10:01:06.382Z', 1 ],
#   [ '2015-01-29T10:01:07.194Z', 2 ],
#   [ '2015-01-29T10:01:09.542Z', 3 ]
# ]
```
You like that? Good.

## Schemas

Notice how in the above example you got a date back? That is because the default schema is `[ date, nmber ]` and if you don't supply date its is auto filled. Soon we will experiment with other schemas.
