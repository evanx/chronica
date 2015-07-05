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

/*
The test harness checks the prefix of the test's key i.e. function name.
It checks accordingly that the function:
- returns its key
- throws its key
- swallows the exception
*/
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
   swallows(key) { // programmer beware
      // any sync function swallows errors in promises
      // so you must have catch() if not returning the promise
      Promise.resolve('any').then(value => {throw value});
   },
   swallowsBetter(key) { // better programming
      Promise.resolve('any').then(value => {throw value})
      .catch(err => {
         if (err !== 'any') {
            console.error('ERROR:', key, err);
         }
      });
   },
   swallowsCatchThrow(key) { // programmer beware
      // any sync function swallows errors in catch
      Promise.resolve('any').then(value => {throw value})
      .catch(err => {throw err});
   },
   async swallowsAsync(key) { // programmer beware
      // swallows errors in promises not awaited or returned
      try {
         Promise.resolve('any').then(value => {throw value});
      } catch (e) {
         assert(false, 'we cannot catch errors without await');
      }
   },
   async throwsAsync(key) { // good usage: return promise
      try {
        return Promise.resolve(key).then(value => {throw value});
     } catch (e) {
        assert(false, 'we cannot catch errors without await');
     }
   },
   async throwsAwaitAsync(key) { // best usage: await promise and catch errors
      try {
         await Promise.resolve(key).then(value => {throw value});
         assert(false, 'error ocurred above, caught below');
      } catch (e) {
         throw e;
      }
   }
}

async function run(keys) {
   return await* keys.map(async (key) => {
      console.log('start', key);
      try {
         if (/Async/.test(key)) {
            let returned = await tests[key](key);
            if (/^returns/.test(key)) {
               assert.equal(returned, key, 'returned: ' + key);
            }
            console.log('done await', key);
         } else {
            let returned = tests[key](key);
            if (/^returns/.test(key)) {
               console.log('returned sync', key, returned);
               assert.equal(returned, key, 'returned: ' + key);
            }
            console.log('done sync', key);
         }
         assert(!/^throws/.test(key), 'not thrown: ' + key);
      } catch (e) {
         console.log('catch', key, e);
         if (e.stack) {
            console.error(e.stack); // show programming errors
         }
         if (/^throws/.test(key)) {
            assert.equal(e, key);
         } else {
            console.error('ERROR: ' + e);
            throw e;
         }
      }
      console.log('end', key);
      return key;
   });
}

var keys = Object.keys(tests);
run(keys).then(results => {
   assert(results.length, keys.length, 'results count matches tests');
   console.info('then', results.length, keys.length);
   let invalidResults = results.filter((result, index) => result !== keys[index]);
   if (invalidResults.length === 0) {
      console.info('OK');
   } else {
      console.info('INVALID:', invalidResults);
   }
}, reason => {
   console.error('run rejected:', reason);
}).catch(error => {
   console.error('run error:', error);
});

/* outputs
evans@boromir:~/chronica$ babel-node --stage 0 test/adhoc/promises/throwing.js
start returnsSanity
returned sync returnsSanity returnsSanity
done sync returnsSanity
end returnsSanity
start returnsSanityAsync
start returnsPromiseAsync
start returnsAwaitAsync
start throwsSanity
catch throwsSanity throwsSanity
end throwsSanity
start throwsSanityAsync
start throwsSanityPromiseAsync
start throwsSanityAwaitAsync
start swallows
done sync swallows
end swallows
start swallowsBetter
done sync swallowsBetter
end swallowsBetter
start swallowsCatchThrow
done sync swallowsCatchThrow
end swallowsCatchThrow
start swallowsAsync
start throwsAsync
start throwsAwaitAsync
done await returnsSanityAsync
end returnsSanityAsync
catch throwsSanityAsync throwsSanityAsync
end throwsSanityAsync
done await swallowsAsync
end swallowsAsync
done await returnsPromiseAsync
end returnsPromiseAsync
done await returnsAwaitAsync
end returnsAwaitAsync
catch throwsSanityPromiseAsync throwsSanityPromiseAsync
end throwsSanityPromiseAsync
catch throwsSanityAwaitAsync throwsSanityAwaitAsync
end throwsSanityAwaitAsync
catch throwsAsync throwsAsync
end throwsAsync
catch throwsAwaitAsync throwsAwaitAsync
end throwsAwaitAsync
then 14 14
OK
*/
