#!/bin/bash -e -o verbose

mongo DataNow --eval "db.dropDatabase()" > /dev/null

rm -f ~/.datanow-config.json

npm uninstall datanow -g
npm link

datanow set --server http://localhost:3000
datanow set --loglevel debug




datanow register --username homer --email glen+homer@datanow.io --password password1
datanow register --username marge --email glen+marge@datanow.io --password password2

datanow login --username homer --email glen+homer@datanow.io --password password1


datanow create homer/test-board-up
datanow create homer/test-board-down
datanow collaborators homer/test-board-up --add marge
datanow collaborators homer/test-board-down --add marge
datanow collaborators homer/test-board-up --list



datanow write 9
datanow set --board homer/test-board-up
datanow write 1
datanow write --board homer/test-board-up 2
datanow write --board homer/test-board-down `date -u +"%Y-%m-%dT%H:%M:%SZ"` 8
datanow write --board homer/test-board-up 3

datanow logout

datanow login --email glen+marge@datanow.io --password password2
datanow write --board homer/test-board-down 7


datanow create marge/test-board-nnsd number number string date
datanow collaborators marge/test-board-nnsd --add homer
datanow set --board marge/test-board-nnsd

datanow write 1 2 chicken `date -u +"%Y-%m-%dT%H:%M:%SZ"`
datanow logout
datanow login --email glen+homer@datanow.io --password password1
datanow write 3 4 duck `date -u +"%Y-%m-%dT%H:%M:%SZ"`

datanow create homer/singleNumbers number

for i in {0..5}; do   datanow write -- $i; done

datanow set --board homer/test-board-up --loglevel info

datanow read --board homer/singleNumbers --limit 3
datanow read --board homer/singleNumbers --limit 3 --page 2

datanow read

datanow read --board homer/test-board-down

datanow read --board marge/test-board-nnsd

datanow read --board homer/singleNumbers --format plot --height 5



say winning
