#!/bin/bash -e -o verbose

mongo DataNow --eval "db.dropDatabase()" > /dev/null

rm -f ~/.datanow-config.json

# MY_PATH="`dirname \"$0\"`"
# DataNow="node $MY_PATH/../bin/cmd.js"
npm link

datanow set --server http://localhost:3000
# datanow set --loglevel debug




datanow register --username garrows --email glen.arrowsmith@gmail.com --password g --noLogin
datanow login --username garrows --email glen.arrowsmith@gmail.com --password g

datanow create testApp
datanow create testApp/testBoard
datanow create testApp2
datanow create testApp2/testBoard2


datanow write 9
datanow set --board testApp/testBoard
datanow write 1
datanow write --board testApp/testBoard 2
datanow write --board testApp2/testBoard2 `date -u +"%Y-%m-%dT%H:%M:%SZ"` 8
datanow write --board testApp/testBoard 3
datanow write --board testApp2/testBoard2 7



datanow create testApp3
datanow create testApp3/testBoard3 number number string date
datanow set --board testApp3/testBoard3

datanow write 1 2 chicken `date -u +"%Y-%m-%dT%H:%M:%SZ"`
datanow write 3 4 duck `date -u +"%Y-%m-%dT%H:%M:%SZ"`

datanow set --board testApp/testBoard
datanow read
datanow read --board testApp2/testBoard2
datanow read --board testApp3/testBoard3

say winning
