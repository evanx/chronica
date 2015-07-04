

c1push() {
  message="$1"
  pwd
  git add --all
  git commit -m "$message"
  git push
  git status
  echo
}

c1commit() {
  message="$1"
  cd util
  c1push $message
  cd ../scripts
  c1push $message
  cd ..
  c1push $message
}


if [ $# -gt 0 ]
then
  c1commit "$1"
else
  c1commit "update"
fi
