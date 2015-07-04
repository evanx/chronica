
import { test } from './export';

console.log(test);

test();

var test2 = require('./export').test;

console.log(test2);

test2();

