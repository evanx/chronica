// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

import { exec } from 'child_process';

function execPromise(command) {
   return new Promise((resolve, reject) => {
      exec(command, (err, stdout, stderr) => {
         if (err) {
            logger.warn('err', err);
            reject(err);
         } else if (stderr) {
            logger.warn('stderr', stderr);
            reject(stderr);
         } else {
            logger.warn('stdout', stdout);
            resolve(stdout);
         }
      });
   });
}

module.exports = {

   create(state, rootConfig, config) {

      const that = {
      };

      async function formatLoad() {
         let loadavg = await Files.readFile('/proc/loadavg');
         return 'cpu:' + lodash.trim(loadavg.toString()).split(' ')[0];
      }

      async function formatRedis() {
         let out = await execPromise('redis-cli info');
         return 'redis:' + lodash(out.toString().split('\n')).find(line =>
            lodash.startsWith(line, 'used_memory_human')).split(':')[1];
      }

      async function formatDisk() {
         let rootDisk = await execPromise('df -h');
         return 'disk:' + lodash.find(rootDisk.toString().split('\n'), line =>
            lodash.endsWith(line, ' /')).split(/\s+/)[4];
      }

      async function systemReport() {
         let fields = [];
         fields.push(await formatLoad());
         fields.push(await formatDisk());
         if (config.redis) {
            fields.push(await formatRedis());
         }
         return fields.join(' ');
      }

      const those = {
         async start() {
            logger.info('started');
         },
         async end() {
         },
         async helloReport() {
            return systemReport();
         },
         async alertReport() {
            return systemReport();
         },
         async dailyReport() {
            return systemReport();
         },
         async hourlyReport() {
            return systemReport();
         },
         async minutely() {

         }
      };
      return those;
   }
};
