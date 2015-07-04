
c0assert() {
  which 'nodejs' || exit 1
  if ! which 'bunyan'
  then
    echo 'Please install: npm install -g bunyan'
    exit 1
  fi
  if ! pwd | grep -q '/chronica-active'
  then
    echo 'Please run from chronica-active/ app directory'
    exit 1
  fi
  if ! which pm2
  then
    echo 'Please install pm2 globally: npm install pm2 -g'
  fi
}

  c0assert

  git pull
  [ -f util/.git ] || git submodule init
  git submodule update

  cd util
  git checkout master
  git pull
