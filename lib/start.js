/*
Copyright 2015 Evan Summers (twitter @evanxsummers, github.com/evanx)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const logger = Loggers.create(module.filename);

import report from './report';
import urlMonitor from './urlMonitor';

start().then(() => {
   logger.info('started');
}).catch(err => {
   logger.error(err);
});

async function start() {
   if (!config.cancelled) {
      await urlMonitor.start();
   }
}

async function cancel() {
   await urlMonitor.end();
}
