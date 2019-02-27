/**
 * Copyright 2019, Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = {
  // Device Cloud Functions
  deviceConfiguration: require('./device-cloud/device-configuration'),
  deviceState: require('./device-cloud/device-state'),
  onlineState: require('./device-cloud/online-state'),
  registerDevice: require('./device-cloud/register-device'),
  // Smart Home Functions
  token: require('./smart-home/token'),
  fulfillment: require('./smart-home/fulfillment'),
  reportState: require('./smart-home/report-state'),
  syncOnAdd: require('./smart-home/request-sync').add,
  syncOnRemove: require('./smart-home/request-sync').remove,
};