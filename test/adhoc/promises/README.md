
### Promises can swallow your errors

The individual test function names are keys from `Object.keys(tests)`

```javascript
const tests = {
   returnsSanity(key) { // sanity check
      return key;
   },
   throwsSanity(key) { // sanity check
      throw key;
   },
```
where we pass each test its own key. According to its prefix being either `return` or `throws,` we expect it to either return or throw this key. Any test that throws or returns any other object is considered a failure. 

We aim to predict how the test will behave i.e. either return or thow its key, according to its prefix, so that all tests pass.

```javascript
   returnsSwallows(key) { // programmer beware: promises can swallow errors
      // so you should have promise.catch() if not returning the promise
      Promise.resolve('any').then(value => {throw value});
      return key;
},
```
where we throw an error in that promise's resolve function to simulate an error therein.

We use the string literal value 'any' to indicate that this value has no bearing on the test.

We test returning promises as follows:
```javascript
   async throwsSanityPromiseAsync(key) { // sanity check
      return Promise.reject(key);
   },
   async throwsAsync(key) { // good practice: return promise
      try {
        return Promise.resolve(key).then(value => {throw value});
     } catch (e) {
        throw 'never happens: we cannot catch errors without await';
     }
   },
```
where the `Async` suffix indicates an ES7 async function implementation for the test.

If any string literal is thrown, the test definitely fails, since this is not the key.

Note that the returned promises that are await'ed, are converted into their resolved values as per the ES7 proposal.

```javascript
   async throwsAwaitAsync(key) { // best practice: await promise and catch errors locally
      try {
         await Promise.resolve(key).then(value => {throw value});
         throw 'never happens: error happened above, caught below';
      } catch (e) {
         console.log('caught', key, e);  // yay
         throw e;
      }
   }
```

#### Test harness

```javascript
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
```

See: https://github.com/evanx/chronica/blob/master/test/adhoc/promises/throwing.js

### Running

We run the tests as follows:

```shell
git clone https://github.com/evanx/chronica.git &&
  cd ~/chronica &&
  node_modules/babel/bin/babel-node --stage 0 test/adhoc/promises/throwing.js
  npm install &&
```

#### Output

The tail of the output is as follows:

```shell
end throwsSanityPromiseAsync
catch throwsSanityAwaitAsync throwsSanityAwaitAsync
end throwsSanityAwaitAsync
caught throwsAwaitAsync throwsAwaitAsync
catch throwsAsync throwsAsync
end throwsAsync
catch throwsAwaitAsync throwsAwaitAsync
end throwsAwaitAsync
results: 14 returnsSanity throwsAwaitAsync
OK
```
