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
const jwt = require('jsonwebtoken');

const fulfillment = smarthome();

/**
 * SYNC Intent Handler
 */
fulfillment.onSync(async (body, headers) => {
  try {
    const userId = validateCredentials(headers);
    // Return all devices registered to the requested user
    const result = await firestore.collection('devices').where('owner', '==', userId).get();
    const deviceList = result.docs.map(doc => {
      const device = Device.createDevice(doc.id, doc.data());
      return device.metadata;
    });

    console.log('SYNC Response', deviceList);
    return {
      requestId: body.requestId,
      payload: {
        agentUserId: userId,
        devices: deviceList
      }
    };
  } catch (error) {
    console.error('Unable to authenticate SYNC request', error);
    return {
      requestId: body.requestId,
      payload: {
        errorCode: 'authFailure',
        debugString: error.toString()
      }
    };
  }
});

/**
 * QUERY Intent Handler
 */
fulfillment.onQuery(async (body, headers) => {
  try {
    validateCredentials(headers);

    const deviceSet = {};
    // Return device state for the requested device ids
    for (const target of body.inputs[0].payload.devices) {
      const doc = await firestore.doc(`devices/${target.id}`).get();
      const device = Device.createDevice(doc.id, doc.data());
      deviceSet[device.id] = device.reportState;
    }

    console.log('QUERY Response', deviceSet);
    return {
      requestId: body.requestId,
      payload: {
        devices: deviceSet
      }
    };
  } catch (error) {
    console.error('Unable to authenticate QUERY request', error);
    return {
      requestId: body.requestId,
      payload: {
        errorCode: 'authFailure',
        debugString: error.toString()
      }
    };
  }
});

/**
 * EXECUTE Intent Handler
 */
fulfillment.onExecute(async (body, headers) => {
  try {
    validateCredentials(headers);
    // Update the device configs for each requested id
    const command = body.inputs[0].payload.commands[0];
    console.log('EXECUTE Request', command);
    // Apply the state update to each device
    const update = Device.stateFromExecution(command.execution);
    const batch = firestore.batch();
    command.devices.forEach(target => {
      const configRef = firestore.doc(`device-configs/${target.id}`);
      batch.update(configRef, update);
    });
    await batch.commit();

    return {
      requestId: body.requestId,
      payload: {
        commands: [
          {
            ids: command.devices.map(device => device.id),
            status: 'PENDING'
          }
        ]
      }
    };
  } catch (error) {
    console.error('Unable to authenticate EXECUTE request', error);
    return {
      requestId: body.requestId,
      payload: {
        errorCode: 'authFailure',
        debugString: error.toString()
      }
    };
  }
});

/**
 * DISCONNECT Intent Handler
 */
fulfillment.onDisconnect(async (body, headers) => {
  try {
    const userId = validateCredentials(headers);

    // Clear the user's current refresh token
    const userRef = firestore.doc(`users/${userId}`);
    await userRef.delete();
    console.log(`Account unlinked: ${userId}`);
    // Return empty body
    return {};
  } catch (error) {
    console.error('Unable to authenticate DISCONNECT request', error);
    return {
      requestId: body.requestId,
      payload: {
        errorCode: 'authFailure',
        debugString: error.toString()
      }
    };
  }
});

/**
 * Verify the request credentials provided by the caller.
 * If successful, return UID encoded in the token.
 */
function validateCredentials(headers) {
  if (!headers.authorization || !headers.authorization.startsWith('Bearer ')) {
    throw new Error('Request missing valid authorization');
  }

  const jwt_secret = functions.config().smarthome.key;
  const token = headers.authorization.split('Bearer ')[1];
  const decoded = jwt.verify(token, jwt_secret);

  return decoded.sub;
}

/**
 * Cloud Function: Handler for Smart Home intents
 */
module.exports = functions.https.onRequest(fulfillment);
