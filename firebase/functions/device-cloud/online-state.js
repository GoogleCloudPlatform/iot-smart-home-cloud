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
 * Cloud Function: Handle device connectivity changes
 */
module.exports = functions.pubsub.topic('online-state').onPublish(async (message) => {
  const logEntry = JSON.parse(Buffer.from(message.data, 'base64').toString());
  const deviceId = logEntry.labels.device_id;

  let online;
  switch (logEntry.jsonPayload.eventType) {
    case 'CONNECT':
      online = true;
      break;
    case 'DISCONNECT':
      online = false;
      break;
    default:
      throw new Error(`Invalid event type received from IoT Core: ${logEntry.jsonPayload.eventType}`);
  }

  // Write the online state into firestore
  const deviceRef = firestore.doc(`devices/${deviceId}`);
  try {
    await deviceRef.update({ 'online': online });
    console.log(`Connectivity updated for ${deviceId}`);
  } catch (error) {
    console.error(`${deviceId} not yet registered to a user`, error);
  }
});
