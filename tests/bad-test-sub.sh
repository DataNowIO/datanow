#!/bin/bash -e -o verbose

mongo DataNow --eval "db.dropDatabase()" > /dev/null

MY_PATH="`dirname \"$0\"`"

rm -f ~/.datanow-config.json

DataNow = "node $MY_PATH/../bin/cmd.js --server http://localhost:3000  --loglevel debug"




$DataNow user --register --username garrows --email glen.arrowsmith@gmail.com --password g
$DataNow user --login --username garrows --email glen.arrowsmith@gmail.com --password g

$DataNow app --create testApp

$DataNow board --create testBoard --app testApp

$DataNow write --app testApp --board testBoard 1
$DataNow write --app testApp --board testBoard 2
$DataNow write --app testApp --board testBoard 3

$DataNow read --app testApp --board testBoard
