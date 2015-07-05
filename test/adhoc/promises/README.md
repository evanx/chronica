
### Promises can swallow your errors

Async functions are an ES7 proposal (stage 0).

The individual test function names are keys from `Object.keys(tests)`

```javascript
const tests = {
   throwsSanity(key) { // sanity check
      throw key;
   },
   returnsSwallows(key) { // programmer beware: promises can swallow errors
      // so you should have promise.catch() if not returning the promise
      Promise.resolve('any').then(value => {throw value});
      return key;
   },
   async throwsSanityAsync(key) { // sanity check
      throw key;
   },
```

The test harness checks the suffix and prefix of the test's key e.g. `returnsPromiseAync`

The suffix is `Async` if it is an ES7 async function (proposed, stage 0).

The prefix is `returns` or `throws.` We check accordingly that the function:
- returns its key, or
- throws its key
where we pass the test its key as an argument.

Any test that throws or returns any other object is considered a failure.

Note that the returned promises are await'ed, and so are converted into their resolved values as per ES7 proposal.

Note that we throw an error is our promise resolved function to simulate an error therein.

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

See: https://github.com/evanx/chronica/blob/master/test/adhoc/promises/throwing.js

### Running

We run the tests as follows:

```shell
git clone https://github.com/evanx/chronica.git &&
  cd ~/chronica &&
  npm install &&
  node_modules/babel/bin/babel-node --stage 0 test/adhoc/promises/throwing.js
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
