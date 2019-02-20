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
const { google } = require('googleapis');
const { firestore } = require('../admin');

/**
 * Return a Promise to obtain the device from Cloud IoT Core
 */
function getDevice(client, deviceId) {
  return new Promise((resolve, reject) => {
    const projectId = process.env.GCLOUD_PROJECT;
    const parentName = `projects/${projectId}/locations/${functions.config().cloudiot.region}`;
    const registryName = `${parentName}/registries/${functions.config().cloudiot.registry}`;

    const request = {
      name: `${registryName}/devices/${deviceId}`
    };
    client.projects.locations.registries.devices.get(request, (err, resp) => {
      if (err) {
        return reject(err);
      } else {
        resolve(resp.data);
      }
    });
  });
}

/**
 * Validate that the public key provided by the pending device matches
 * the key currently stored in IoT Core for that device id.
 *
 * Method throws an error if the keys do not match.
 */
function verifyDeviceKey(pendingDevice, deviceKey) {
  // Convert the pending key into PEM format
  const chunks = pendingDevice.public_key.match(/(.{1,64})/g);
  chunks.unshift('-----BEGIN PUBLIC KEY-----');
  chunks.push('-----END PUBLIC KEY-----');
  const pendingKey = chunks.join('\n');

  if (deviceKey !== pendingKey) throw new Error(`Public Key Mismatch:\nExpected: ${deviceKey}\nReceived: ${pendingKey}`);
}

/**
 * Cloud Function: Verify IoT device and add to user
 */
module.exports = functions.firestore.document('pending/{device}').onWrite(async (change, context) => {
  const deviceId = context.params.device;

  // Verify this is either a create or update
  if (!change.after.exists) {
    console.log(`Pending device removed for ${deviceId}`);
    return;
  }
  console.log(`Pending device created for ${deviceId}`);
  const pending = change.after.data();

  // Create a new Cloud IoT client
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  const client = google.cloudiot({
    version: 'v1',
    auth: auth
  });

  try {
    // Verify device does NOT already exist in Firestore
    const deviceRef = firestore.doc(`devices/${deviceId}`);
    const deviceDoc = await deviceRef.get();
    if (deviceDoc.exists) throw new Error(`${deviceId} is already registered to another user`);

    // Verify device exists in IoT Core
    const result = await getDevice(client, deviceId);

    // Verify the device public key
    verifyDeviceKey(pending, result.credentials[0].publicKey.key.trim());

    // Verify the device type
    let configValue = null;
    switch (pending.type) {
      case 'light':
        configValue = require('./default-light.json');
        break;
      case 'thermostat':
        configValue = require('./default-thermostat.json');
        break;
      default:
        throw new Error(`Invalid device type found in ${deviceId}: ${pending.type}`);
    }

    // Commit the following changes together
    const batch = firestore.batch();

    // Insert valid device for the requested owner
    const device = {
      name: pending.serial_number,
      owner: pending.owner,
      type: pending.type,
      online: false
    };
    batch.set(deviceRef, device);

    // Generate a default configuration
    const configRef = firestore.doc(`device-configs/${deviceId}`);
    const config = {
      owner: pending.owner,
      value: configValue
    };
    batch.set(configRef, config);

    // Remove the pending device entry
    batch.delete(change.after.ref);

    await batch.commit();
    console.log(`Added device ${deviceId} for user ${pending.owner}`);
  } catch (error) {
    // Device does not exist in IoT Core or key doesn't match
    console.error('Unable to register new device', error);
  }
});
