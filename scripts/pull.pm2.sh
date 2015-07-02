

  which bunyan || exit 1
  which pm2 || exit 1

  rm -f ~/.pm2/logs/chronica-active-*

  [ -f  ~/.chronica-active.yaml ] || exit 1

  cat index.js | grep -q evanxsummers || exit 1

  git pull
  git submodule update

  pm2 restart chronica-active

  pm2 show chronica-active

  sleep 2

  ls -l ~/.pm2/logs/chronica-active-*
