

  which bunyan || exit 1
  which pm2 || exit 1

  rm -f /home/evans/.pm2/logs/chronica-active-*

  [ -f  ~/.chronica-active.yaml ] || exit 1

  cat index.js | grep evanxsummers || exit 1

  pm2 stop chronica-active 

  pm2 start index.js --name chronica-active -- ~/.chronica-active.yaml debug

  pm2 show chronica-active

  sleep 2 

  if ls -l /home/evans/.pm2/logs/chronica-active-*
  then
    tail /home/evans/.pm2/logs/chronica-active-out* | bunyan -o short 
  fi

