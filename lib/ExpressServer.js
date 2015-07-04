
// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

import assert from 'assert';
import lodash from 'lodash';
import express from 'express';

import ExpressResponses from './ExpressResponses';

const logger = Loggers.create(module.filename);

export default function create(state, config) {

   let app, server, listening;

   const those = {
      get state() {
         return { config, listening };
      },
      init() {
         assert(config.port, 'port');
         assert(config.timeout, 'timeout');
      },
      async start() {
         app = express();
         logger.info('listening', config.port);
      },
      end() {
         if (server) {
            server.close();
            logger.info('end');
         } else {
            logger.warn('end');
         }
      },
   };

   return those;
}
