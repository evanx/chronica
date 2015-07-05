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
   swallowSyncNoneSanity(name) { // sanity check
   },
   async swallowAsyncNoneSanity(name) { // sanity check
   },
   throwSyncSanity(name) { // sanity check
      throw name;
   },
   async throwAsyncSanity(name) { // sanity check
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
      try {
         Promise.resolve('any').then(value => {throw value});
      } catch (e) {
         assert(false, 'we cannot catch errors without await');
      }
   },
   async throwAsyncReturnGood(name) { // good usage: return promise
      try {
        return Promise.resolve(name).then(value => {throw value});
     } catch (e) {
        assert(false, 'but we cannot catch errors when returning promise');
     }
   },
   async throwAsyncAwaitBest(name) { // best usage: await promise and catch errors
      try {
         await Promise.resolve(name).then(value => {throw value});
         assert(false, 'error ocurred above, caught below')
      } catch (e) {
         throw e;
      }
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
         try {
            assert(/throw/.test(name), 'throw: ' + name);
            if (e.stack) {
               console.error(e.stack); // show programming errors
            }
            assert.equal(e, name);
         } catch (err) {
            console.error('ERROR: ' + err);
            throw err;
         }
      }
      console.log('end', name);
   });
}

run().then(value => {
   logger.info('run resolved:', value);
}, reason => {
   logger.info('run rejected:', reason);
}).catch(error => {
   logger.info('run error:', error);
})

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
