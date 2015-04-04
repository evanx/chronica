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


var Alerts = require('./Alerts');

function setStatus(service, status, message) {
   if (!service.currentStatus) {
      service.currentStatus = status;
      service.alertStatus = service.currentStatus;
      service.statusCount = 1000;
   } else if (service.currentStatus === status) {
      service.statusCount += 1;
      if (service.statusCount === global.config.checkUrls.alertCount) {
         if (service.alertStatus !== service.currentStatus) {
            service.alertStatus = service.currentStatus;
            Alerts.sendAlert('ALERT ' + service.name + ' ' + status, message);
         }
      }
   } else {
      service.statusCount = 0;
      service.currentStatus = status;
   }
}

module.exports = { setStatus };
