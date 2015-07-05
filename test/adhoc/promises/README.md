
### Promises can swallow your errors

Async functions are an ES7 proposal (stage 0).

The individual test function names are keys from `Object.keys(tests)``

The test harness checks the suffix and prefix of the test's key e.g. `returnsPromiseAync`

The suffix is `Async` if it is an ES7 async function (proposed, stage 0).

The prefix is `returns` or `throws.` We check accordingly that the function:
- returns its key, or
- throws its key
where we pass the test its key as an argument.

Any test that throws or returns any other object is considered a failure.

Note that the returned promises are await'ed, and so are converted into their resolved values as per ES7 proposal.

Note that we throw an error is our promise resolved function to simulate an error therein.


### Running

```
We run this test as follows:

git clone https://github.com/evanx/chronica.git &&
  cd ~/chronica &&
  npm install &&
  node_modules/babel/bin/babel-node --stage 0 test/adhoc/promises/throwing.js
```

#### Output

```
evans@boromir:~/chronica$ babel-node --stage 0 test/adhoc/promises/throwing.js | tail
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
