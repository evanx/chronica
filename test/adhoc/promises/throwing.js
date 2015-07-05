// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import assert from 'assert';
import lodash from 'lodash';

const tests = {
   returnsSanity(key) { // sanity check
      return key;
   },
   async returnsSanityAsync(key) { // sanity check
      return key;
   },
   async returnsPromiseAsync(key) { // sanity check
      return Promise.resolve(key);
   },
   async returnsAwaitAsync(key) { // sanity check
      return await Promise.resolve(key);
   },
   throwsSanity(key) { // sanity check
      throw key;
   },
   async throwsSanityAsync(key) { // sanity check
      throw key;
   },
   async throwsSanityPromiseAsync(key) { // sanity check
      return Promise.reject(key);
   },
   async throwsSanityAwaitAsync(key) { // sanity check
      return await Promise.reject(key);
   },
   returnsSwallows(key) { // programmer beware: promises can swallow errors
      // so you should have promise.catch() if not returning the promise
      Promise.resolve('any').then(value => {throw value});
      return key;
   },
   returnsBetter(key) { // better practice: use promise.catch()
      Promise.resolve('any').then(value => {throw value})
      .catch(err => {
         if (err !== 'any') {
            // throwed errors will be swallowed so just log it
            console.error('ERROR:', key, err);
         }
      });
      return key;
   },
   returnsCatchThrow(key) { // programmer beware
      // errors in promise.catch() are swallowed
      Promise.resolve('any').then(value => {throw value})
      .catch(err => {throw err});
      return key;
   },
   async returnsAsync(key) { // programmer beware
      // errors are swallowed in promises not awaited or returned
      try {
         Promise.resolve('any').then(value => {throw value});
         return key;
      } catch (e) {
         throw 'never happens: we cannot catch errors without await';
      }
   },
   async throwsAsync(key) { // good practice: return promise
      try {
        return Promise.resolve(key).then(value => {throw value});
     } catch (e) {
        throw 'never happens: we cannot catch errors without await';
     }
   },
   async throwsAwaitAsync(key) { // best practice: await promise and catch errors locally
      try {
         await Promise.resolve(key).then(value => {throw value});
         throw 'never happens: error happened above, caught below';
      } catch (e) {
         console.log('caught', key, e);  // yay
         throw e;
      }
   }
}

var keys = Object.keys(tests);
run(keys).then(results => {
   console.info('results:', results.length, results[0], results[results.length - 1]);
   assert.equal(results.length, keys.length, 'results length matches number of tests');
   assert.equal(results.filter((result, index) => result !== keys[index]).length, 0, 'all results match');
   console.info('OK');
}, reason => {
   console.error('run rejected:', reason);
}).catch(error => {
   console.error('run error:', error);
});

async function run(keys) {
   return await* keys.map(async (key) => {
      console.log('start', key);
      try {
         if (/Async/.test(key)) {
            let returned = await tests[key](key); // if promise returned, resolved by 'await'
            if (/^returns/.test(key)) {
               assert.equal(returned, key, 'returned: ' + key); // must match key
            }
            console.log('done await', key);
         } else {
            let returned = tests[key](key);
            if (/^returns/.test(key)) {
               console.log('returned sync', key, returned);
               assert.equal(returned, key, 'returned: ' + key); // must match key
            }
            console.log('done sync', key);
         }
         assert(!/^throws/.test(key), 'not throws: ' + key); // should have thrown an error
      } catch (e) {
         console.log('catch', key, e);
         if (e.stack) {
            console.error(e.stack); // show programming errors
         }
         if (/^throws/.test(key)) { // expected an error,
            assert.equal(e, key); // but must match the key e.g. not AssertionError
         } else { // should not have thrown an error
            console.error('ERROR: ' + e);
            throw e;
         }
      }
      console.log('end', key);
      return key;
   });
}

// Notes: <a href="https://github.com/evanx/chronica/tree/master/test/adhoc/promises/README.md">README.md</a>
