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

/**
 * Cloud Function: Handle device state updates
 */
module.exports = functions.pubsub.topic('device-events').onPublish(async (message) => {
  const deviceId = message.attributes.deviceId;

  // Write the device state into firestore
  const deviceRef = firestore.doc(`devices/${deviceId}`);
  try {
    // Ensure the device is also marked as 'online' when state is updated
    await deviceRef.update({ 'state': message.json, 'online': true });
    console.log(`State updated for ${deviceId}`);
  } catch (error) {
    console.error(`${deviceId} not yet registered to a user`, error);
  }
});
