// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

/* we run this test as follows:
   babel-node --stage 0 test/adhoc/promises/throwing.js
   */

import assert from 'assert';
import lodash from 'lodash';

const tests = {
   swallowSyncNone(name) {
   },
   async swallowAsyncNone(name) {
   },
   throwSync(name) {
      throw name;
   },
   async throwAsync(name) {
      throw name;
   },
   swallowSyncDangerously(name) {
      // Programmer BEWARE: any sync method will swallow exception in promise
      Promise.resolve('any').then(value => {throw value});
   },
   async swallowAsyncDangerously(name) {
      // Programmer BEWARE: any async method will swallow exception in promise if not awaited
      Promise.resolve('any').then(value => {throw value});
   },
   async throwAsyncReturn(name) {
      return Promise.resolve(name).then(value => {throw value});
   },
   async throwAsyncAwait(name) {
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
            console.error(e.stack);
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
