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
   returnSanity(key) { // sanity check
      return key;
   },
   async returnSanityAsync(key) { // sanity check
      return key;
   },
   async returnPromiseAsync(key) { // sanity check
      return Promise.resolve(key);
   },
   async returnAwaitAsync(key) { // sanity check
      return await Promise.resolve(key);
   },
   throwSanity(key) { // sanity check
      throw key;
   },
   async throwSanityAsync(key) { // sanity check
      throw key;
   },
   async throwSanityPromiseAsync(key) { // sanity check
      return Promise.reject(key);
   },
   swallow(key) { // programmer beware
      // any sync method will swallow errors in promises
      // so you must have catch() if not returning the promise
      Promise.resolve('any').then(value => {throw value});
   },
   swallowBetter(key) { // better programming
      Promise.resolve('any').then(value => {throw value})
      .catch(err => assert.equals(err, 'any'));
   },
   swallowCatchThrow(key) { // programmer beware
      // any sync method will swallow errors in catch
      Promise.resolve('any').then(value => {throw value})
      .catch(err => {throw err});
   },
   async swallowAsync(key) { // programmer beware
      // swallows errors in promises not awaited or returned
      try {
         Promise.resolve('any').then(value => {throw value});
      } catch (e) {
         assert(false, 'we cannot catch errors without await');
      }
   },
   async throwAsync(key) { // good usage: return promise
      try {
        return Promise.resolve(key).then(value => {throw value});
     } catch (e) {
        assert(false, 'we cannot catch errors without await');
     }
   },
   async throwAwaitAsync(key) { // best usage: await promise and catch errors
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
            if (/return/.test(key)) {
               assert.equal(returned, key, 'returned: ' + key);
            }
            console.log('done await', key);
         } else {
            let returned = tests[key](key);
            if (/return/.test(key)) {
               console.log('returned sync', key, returned);
               assert.equal(returned, key, 'returned: ' + key);
            }
            console.log('done sync', key);
         }
         assert(!/throw/.test(key), 'not thrown: ' + key);
      } catch (e) {
         console.log('catch', key, e);
         if (e.stack) {
            console.error(e.stack); // show programming errors
         }
         if (/throw/.test(key)) {
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
   results.forEach((result, index) => {console.log(result, keys[index])});
   console.info('OK');
}, reason => {
   console.error('run rejected:', reason);
}).catch(error => {
   console.error('run error:', error);
});

/* outputs
evans@boromir:~/chronica$ babel-node --stage 0 test/adhoc/promises/throwing.js
start returnSanity
returned sync returnSanity returnSanity
done sync returnSanity
end returnSanity
start returnSanityAsync
start returnPromiseAsync
start throwSanity
catch throwSanity throwSanity
end throwSanity
start throwSanityAsync
start throwSanityPromiseAsync
start swallow
done sync swallow
end swallow
start swallowBetter
done sync swallowBetter
end swallowBetter
start swallowCatchThrow
done sync swallowCatchThrow
end swallowCatchThrow
start swallowAsync
start throwAsync
start throwAwaitAsync
done await returnSanityAsync
end returnSanityAsync
catch throwSanityAsync throwSanityAsync
end throwSanityAsync
done await swallowAsync
end swallowAsync
done await returnPromiseAsync
end returnPromiseAsync
catch throwSanityPromiseAsync throwSanityPromiseAsync
end throwSanityPromiseAsync
catch throwAsync throwAsync
end throwAsync
catch throwAwaitAsync throwAwaitAsync
end throwAwaitAsync
then 12 12
returnSanity returnSanity
returnSanityAsync returnSanityAsync
returnPromiseAsync returnPromiseAsync
throwSanity throwSanity
throwSanityAsync throwSanityAsync
throwSanityPromiseAsync throwSanityPromiseAsync
swallow swallow
swallowBetter swallowBetter
swallowCatchThrow swallowCatchThrow
swallowAsync swallowAsync
throwAsync throwAsync
throwAwaitAsync throwAwaitAsync
OK
*/
