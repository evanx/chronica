// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

/* we run this test as follows:
cd ~/chronica
babel-node --stage 0 test/adhoc/promises/throwing.js
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
      // any sync method will swallow exception in promise
      // so you must invoke then() if not returning the promise
      Promise.resolve('any').then(value => {throw value});
   },
   swallowSyncCatchThrowBeware(name) { // programmer beware
      // any sync method will swallow exception thrown in catch
      Promise.resolve('any').then(value => {throw value}).catch(err => {throw err});
   },
   async swallowAsyncBeware(name) { // programmer beware
      // any async method will swallow exception in promise not awaited or returned
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
