#!/bin/bash -e -o verbose

mongo DataNow --eval "db.dropDatabase()" > /dev/null

MY_PATH="`dirname \"$0\"`"

rm -f ~/.datanow-config.json

DataNow = "node $MY_PATH/../bin/cmd.js --server http://localhost:3000  --loglevel debug"




$DataNow --register --username garrows --email glen.arrowsmith@gmail.com --password g
$DataNow --login --username garrows --email glen.arrowsmith@gmail.com --password g

$DataNow --newApp testApp

$DataNow --newBoard testBoard --app testApp

$DataNow --app testApp --board testBoard --write 1
$DataNow --app testApp --board testBoard --write 2
$DataNow --app testApp --board testBoard --write 3

$DataNow --app testApp --board testBoard --read
