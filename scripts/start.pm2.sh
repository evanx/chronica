

  [ -f  ~/etc/chronica.yaml ] || exit 1

  cat index.js | grep -q evanxsummers || exit 1

  node_modules/pm2/bin/pm2 start index.js --name chronica-active -- ~/etc/chronica.yaml

  node_modules/pm2/bin/pm2 show chronica-active

  sleep 2

  ls -l --sort=time ~/.pm2/logs/chronica-active*
