#!/bin/bash -e -o verbose

mongo DataNow --eval "db.dropDatabase()" > /dev/null

MY_PATH="`dirname \"$0\"`"

rm -f ~/.datanow-config.json

DataNow="node $MY_PATH/../bin/cmd.js --server http://localhost:3000  --loglevel debug"
DataNow="node $MY_PATH/../bin/cmd.js --server http://localhost:3000"




$DataNow register --username garrows --email glen.arrowsmith@gmail.com --password g --noLogin
$DataNow login --username garrows --email glen.arrowsmith@gmail.com --password g

$DataNow create testApp
$DataNow create testApp/testBoard
$DataNow create testApp2
$DataNow create testApp2/testBoard2

$DataNow use testApp/testBoard

$DataNow write 1
$DataNow use testApp2/testBoard2
$DataNow write 1
$DataNow write --board testApp/testBoard 2
$DataNow write --board testApp2/testBoard2 2
$DataNow write --board testApp/testBoard 3
$DataNow write --board testApp2/testBoard2 3

# $DataNow read
$DataNow read --board testApp/testBoard
$DataNow read --board testApp2/testBoard2
say winning
