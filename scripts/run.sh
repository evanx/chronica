
if ! ls -l  ~/.chronica-active.yaml
then
  echo 'Create config file e.g.  ~/.chronica-active.yaml'
  echo 'See https://github.com/evanx/chronica-active'
  exit 1
fi

if ! cat index.js | grep -q evanxsummers
then
  echo 'Run from chronica directory e.g. cd ~/chronica-active'
  exit 1
fi

if ! pwd | grep -q "/chronica-active"
then
  echo "Please run from chronica-active directory"
  exit 1
fi

[ -d util/.git ] || git submodule init
[ -f util/Utils.js ] || git submodule update

if [ ! -d util/.git ]
then
   echo 'Please init the util/ git submodule: git submodule init'
   exit 1
fi

if [ ! -f util/Utils.js ]
then
  echo 'Please update the util/ git submodule: git submodule update'
  exit 1
fi

if node -v | grep ^v
then
  node index.js ~/.chronica-active.yaml debug | ./node_modules/bunyan/bin/bunyan -o short
elif nodejs -v | grep ^v
then
  nodejs index.js ~/.chronica-active.yaml debug | ./node_modules/bunyan/bin/bunyan -o short
else
   echo 'Please install Node'
   exit 1
fi
