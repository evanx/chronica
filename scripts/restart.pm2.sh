

  which bunyan || exit 1
  which pm2 || exit 1

  rm -f ~/.pm2/logs/chronica-active-*

  [ -f  ~/.chronica-active.yaml ] || exit 1

  cat index.js | grep -q evanxsummers || exit 1

  pm2 stop chronica-active

  pm2 start index.js --name chronica-active -- ~/.chronica-active.yaml

  pm2 show chronica-active

  sleep 2

  ls -l ~/.pm2/logs/chronica-active-*
