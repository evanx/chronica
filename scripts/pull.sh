
if ! pwd | grep -q '/chronica-active'
then
  echo 'Please run from chronica-active app directory e.g. cd ~/chronica-active'
  exit 1
fi

if ! which pm2
then
  echo 'Please install globally: sudo npm install -g pm2'
fi

  git pull
  [ -f util/.git ] || git submodule init
  git submodule update

  cd util
  git checkout master
  git pull
