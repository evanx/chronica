
  if ls --sort=time ~/.pm2/logs/chronica-active-err*
  then
    err=`ls --sort=time ~/.pm2/logs/chronica-active-err* | head -1`
    echo; echo "$err"
    tail $err | node_modules/bunyan/bin/bunyan -o short
    ls -l $err
  fi

  if ls --sort=time ~/.pm2/logs/chronica-active-out*
  then
    out=`ls --sort=time ~/.pm2/logs/chronica-active-out* | head -1`
    echo; echo "$out"
    tail -f $out | node_modules/bunyan/bin/bunyan -o short
    ls -l $out
  fi
