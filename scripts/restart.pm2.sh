

if ! ls -l  ~/.chronica-active.yaml
then
  echo 'Create config file e.g.  ~/.chronica-active.yaml'
  echo 'See https://github.com/evanx/chronica-active'
  exit 1
fi

if ! pwd | grep -q '/chronica-active'
then
  echo 'Please cd into and run from chronica directory e.g. cd ~/chronica-active'
  exit 1
fi

  rm -f ~/.pm2/logs/chronica-active-*

  [ -f  ~/.chronica-active.yaml ] || exit 1

  cat index.js | grep -q evanxsummers || exit 1

  node_modules/pm2/bin/pm2 stop chronica-active

  node_modules/pm2/bin/pm2 start index.js --name chronica-active -- ~/.chronica-active.yaml

  node_modules/pm2/bin/pm2 show chronica-active

  sleep 2

  ls -l ~/.pm2/logs/chronica-active-*

  ls --sort=time ~/.pm2/logs/chronica-active-err-*.log |
     head -1 | xargs cat | bunyan -o short

  ls --sort=time ~/.pm2/logs/chronica-active-out-*.log |
     head -1 | xargs tail -f | bunyan -o short
