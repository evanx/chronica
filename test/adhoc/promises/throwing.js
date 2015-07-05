// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

/* we run this test as follows:
git clone https://github.com/evanx/chronica.git &&
cd ~/chronica &&
npm install &&
node_modules/babel/bin/babel-node --stage 0 test/adhoc/promises/throwing.js
*/

import assert from 'assert';
import lodash from 'lodash';

const tests = {
   swallowSyncNone(name) { // sanity check
   },
   async swallowAsyncNone(name) { // sanity check
   },
   throwSync(name) { // sanity check
      throw name;
   },
   async throwAsync(name) { // sanity check
      throw name;
   },
   swallowSyncBeware(name) { // programmer beware
      // any sync method will swallow errors in promises
      // so you must have catch() if not returning the promise
      Promise.resolve('any').then(value => {throw value});
   },
   swallowSyncBetter(name) { // better programming
      Promise.resolve('any').then(value => {throw value})
      .catch(err => assert.equals(err, 'any'));
   },
   swallowSyncCatchThrowBeware(name) { // programmer beware
      // any sync method will swallow errors in catch
      Promise.resolve('any').then(value => {throw value})
      .catch(err => {throw err});
   },
   async swallowAsyncBeware(name) { // programmer beware
      // swallows errors in promises not awaited or returned
      Promise.resolve('any').then(value => {throw value});
   },
   async throwAsyncReturn(name) { // good usage: return promise
      return Promise.resolve(name).then(value => {throw value});
   },
   async throwAsyncAwait(name) { // good usage: await promise
      await Promise.resolve(name).then(value => {throw value});
   }
}

async function run() {
   return await* Object.keys(tests).forEach(async (name) => {
      console.log('start', name);
      try {
         if (/Async/.test(name)) {
            await tests[name](name);
            console.log('done await', name);
         } else {
            tests[name](name);
            console.log('done sync', name);
         }
         assert(/swallow/.test(name), 'swallow: ' + name);
      } catch (e) {
         console.log('catch', name, e);
         assert(/throw/.test(name), 'throw: ' + name);
         if (e.stack) {
            console.error(e.stack); // show programming errors
         }
         assert.equal(e, name);
      }
      console.log('end', name);
   })
}

run().then(value => {
   logger.info('run resolved:', value);
}, reason => {
   logger.info('run rejected:', reason);
});

/* outputs
evans@boromir:~/chronica$ babel-node --stage 0 test/adhoc/promises/throwing.js
start swallowSyncNone
done sync swallowSyncNone
end swallowSyncNone
start swallowAsyncNone
start throwSync
catch throwSync throwSync
end throwSync
start throwAsync
start swallowSyncBeware
done sync swallowSyncBeware
end swallowSyncBeware
start swallowSyncBetter
done sync swallowSyncBetter
end swallowSyncBetter
start swallowSyncCatchThrowBeware
done sync swallowSyncCatchThrowBeware
end swallowSyncCatchThrowBeware
start swallowAsyncBeware
start throwAsyncReturn
start throwAsyncAwait
done await swallowAsyncNone
end swallowAsyncNone
catch throwAsync throwAsync
end throwAsync
done await swallowAsyncBeware
end swallowAsyncBeware
catch throwAsyncReturn throwAsyncReturn
end throwAsyncReturn
catch throwAsyncAwait throwAsyncAwait
end throwAsyncAwait
*/
