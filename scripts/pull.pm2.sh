
if ! which pm2
then
  echo 'Please install pm2 globally: sudo npm install pm2 -g'
  exit 1
fi

  rm -f ~/.pm2/logs/chronica-active-*

  [ -f  ~/.chronica-active.yaml ] || exit 1

  cat index.js | grep -q evanxsummers || exit 1

  git pull
  git submodule update

  pm2 restart chronica-active

  pm2 show chronica-active

  sleep 2

  ls --sort=time ~/.pm2/logs/chronica-active-err-*.log |
     head -1 | xargs cat |
     node_modules/bunyan/bin/bunyan

  ls --sort=time ~/.pm2/logs/chronica-active-out-*.log |
     head -1 | xargs tail -f |
     node_modules/bunyan/bin/bunyan
