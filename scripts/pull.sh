
if ! pwd | grep -q '/chronica-active'
then
  echo 'Please run from chronica-active app directory e.g. cd ~/chronica-active'
  exit 1
fi

  git pull
  [ -f util/.git ] || git submodule init
  git submodule update

  cd util
  git checkout master
  git pull
