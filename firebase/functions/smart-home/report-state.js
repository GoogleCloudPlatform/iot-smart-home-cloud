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

const functions = require('firebase-functions');
const { firestore } = require('../admin');
const { smarthome } = require('actions-on-google');
const Device = require('./device-model');
const uuid = require('uuid/v4');

const homegraph = smarthome({
  jwt: require('./service-account.json')
});

/**
 * Cloud Function: Report device state changes to Assistant HomeGraph
 */
module.exports = functions.firestore.document('devices/{device}').onUpdate(async (change, context) => {
  const deviceId = context.params.device;
  const device = Device.createDevice(deviceId, change.after.data());

  // Check if user has linked to Assistant
  const linked = await verifyAccountLink(device.owner);
  if (!linked) {
    console.log(`User ${device.owner} not linked to Assistant`);
    return;
  }

  // Send a state report
  const report = {};
  report[device.id] = device.reportState;
  console.log('Sending state report', report);
  await homegraph.reportState({
    requestId: uuid(),
    agentUserId: device.owner,
    payload: {
      devices: {
        states: report
      }
    }
  });
});

/**
 * Verify if the user has linked their account to the Assistant
 */
async function verifyAccountLink(userId) {
  const userRef = firestore.doc(`users/${userId}`);
  const user = await userRef.get();
  return (user.exists && user.data().hasOwnProperty('refresh_token'));
}
