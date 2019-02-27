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

const homegraph = smarthome({
  jwt: require('./service-account.json')
});

/**
 * Cloud Function: Request a sync with the Assistant HomeGraph
 * on device add
 */
module.exports.add = functions.firestore.document('devices/{device}')
  .onCreate(handleRequestSync);

/**
 * Cloud Function: Request a sync with the Assistant HomeGraph
 * on device remove
 */
module.exports.remove = functions.firestore.document('devices/{device}')
  .onDelete(handleRequestSync);

/**
 * Handler to request SYNC through the HomeGraph API
 */
async function handleRequestSync(snapshot, context) {
  // Obtain the device owner UID
  const userId = snapshot.data().owner;

  // Check if user has linked to Assistant
  const linked = await verifyAccountLink(userId);
  if (!linked) {
    console.log(`User ${userId} not linked to Assistant`);
    return;
  }

  // Send a sync request
  console.log(`Requesting SYNC for account: ${userId}`);
  await homegraph.requestSync(userId);
}

/**
 * Verify if the user has linked their account to the Assistant
 */
async function verifyAccountLink(userId) {
  const userRef = firestore.doc(`users/${userId}`);
  const user = await userRef.get();
  return (user.exists && user.data().hasOwnProperty('refresh_token'));
}