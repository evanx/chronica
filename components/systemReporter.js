// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import { exec } from 'child_process';

export function create(config, logger, context) {

   const that = {
   };

   async function getLoad() {
      let loadavg = await Files.readFile('/proc/loadavg');
      return lodash.trim(loadavg.toString()).split(' ')[0];
   }

   async function getRedis() {
      let out = await execPromise('redis-cli info');
      let used = lodash(out.toString().split('\n')).find(line => {
         return lodash.startsWith(line, 'used_memory');
      }).split(':')[1]/1024/1024;
      return lodash.trim(used);
   }

   async function getDisk() {
      let rootDisk = await execPromise('df -h');
      return lodash.find(rootDisk.toString().split('\n'), line =>
         lodash.endsWith(line, ' /')).split(/\s+/)[4].replace(/%$/, '');
   }

   async function formatLoad() {
      return 'cpu:' + await getLoad();
   }

   async function formatRedis() {
      return 'redis:' + await getRedis() + 'M';
   }

   async function formatDisk() {
      let disk = await getDisk();
      return 'disk:' + disk + '%';
   }

   async function getReport() {
      let report = {};
      report.hostname = context.stores.environment.hostname;
      report.load = parseInt(await getLoad());
      report.disk = parseInt(await getDisk());
      if (config.redis) {
         report.redis = parseInt(await getRedis());
      }
      logger.info('getReport', report);
      return report;
   }

   async function systemReport() {
      let fields = [];
      fields.push(context.stores.environment.hostname);
      fields.push(await formatLoad());
      fields.push(await formatDisk());
      if (config.redis) {
         fields.push(await formatRedis());
      }
      return fields.join(' ');
   }

   const those = {
      async pub() {
         return await getReport();
      },
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

function execPromise(command) {
   return new Promise((resolve, reject) => {
      exec(command, (err, stdout, stderr) => {
         if (err) {
            reject(err);
         } else if (stderr) {
            reject(stderr);
         } else {
            resolve(stdout);
         }
      });
   });
}
