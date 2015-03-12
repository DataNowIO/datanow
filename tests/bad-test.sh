#!/bin/bash -e -o verbose

mongo DataNow --eval "db.dropDatabase()" > /dev/null

rm -f ~/.datanow-config.json

npm uninstall datanow -g
npm link

datanow set --server http://localhost:3000
datanow set --loglevel debug




datanow register --username garrows --email glen.arrowsmith@gmail.com --password g
datanow register --username garrows2 --email glen@datanow.io --password g2

datanow login --username garrows --email glen.arrowsmith@gmail.com --password g


datanow create garrows/testBoard
datanow collaborator garrows/testBoard --add garrows2
exit 1

datanow create garrows/testBoard2


datanow write 9
datanow set --board garrows/testBoard
datanow write 1
datanow write --board garrows/testBoard 2
datanow write --board garrows/testBoard2 `date -u +"%Y-%m-%dT%H:%M:%SZ"` 8
datanow write --board garrows/testBoard 3

# datanow logout
# datanow login --email glen@datanow.io --password g2
# datanow write --board garrows/testBoard2 7
#
#
# datanow create garrows/testBoard4
# datanow create testApp3
# datanow create testApp3/testBoard3 number number string date
# datanow collaborator testApp3/testBoard3 --add garrows
# datanow set --board testApp3/testBoard3
#
# datanow write 1 2 chicken `date -u +"%Y-%m-%dT%H:%M:%SZ"`
# datanow logout
# datanow login --email glen.arrowsmith@gmail.com --password g
# datanow write 3 4 duck `date -u +"%Y-%m-%dT%H:%M:%SZ"`
#
datanow create garrows/singleNumbers number

for i in {0..5}; do   datanow write -- $i; done

datanow set --board garrows/testBoard --loglevel info

datanow read --board garrows/singleNumbers --limit 3
datanow read --board garrows/singleNumbers --limit 3 --page 2

datanow read
#
# datanow read --board garrows/testBoard2
#
# datanow read --board testApp3/testBoard3
#
datanow read --board garrows/singleNumbers --format plot



say winning
