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

/**
 * Return a promise to publish the new device config to Cloud IoT Core
 */
function updateConfig(client, deviceId, config) {
  return new Promise((resolve, reject) => {
    const projectId = process.env.GCLOUD_PROJECT;
    const parentName = `projects/${projectId}/locations/${functions.config().cloudiot.region}`;
    const registryName = `${parentName}/registries/${functions.config().cloudiot.registry}`;

    const request = {
      name: `${registryName}/devices/${deviceId}`,
      binaryData: Buffer.from(JSON.stringify(config)).toString('base64')
    };
    client.projects.locations.registries.devices.modifyCloudToDeviceConfig(request, (err, resp) => {
      if (err) {
        return reject(err);
      } else {
        resolve(resp.data);
      }
    });
  });
}

/**
 * Cloud Function: Handle device configuration changes
 */
module.exports = functions.firestore.document('device-configs/{device}').onWrite(async (change, context) => {
  const deviceId = context.params.device;

  // Verify this is either a create or update
  if (!change.after.exists) {
    console.log(`Device configuration removed for ${deviceId}`);
    return;
  }
  const config = change.after.data();

  // Create a new Cloud IoT client
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  const client = google.cloudiot({
    version: 'v1',
    auth: auth
  });

  // Send the device message through Cloud IoT
  console.log(`Sending configuration for ${deviceId}`);
  try {
    const result = await updateConfig(client, deviceId, config.value);
    console.log(result);
  } catch (error) {
    console.error(`Unable to send IoT Core configuration for ${deviceId}`, error);
  }
});
