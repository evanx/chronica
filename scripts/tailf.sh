
   ls --sort=time ~/.pm2/logs/chronica-active-out-* | head -1 | xargs tail -f | node_modules/bunyan/bin/bunyan -o short
