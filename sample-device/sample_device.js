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

'use strict';

const fs = require('fs');
const jwt = require('jsonwebtoken');
const mqtt = require('mqtt');

const TOKEN_EXP_MINS = 20;
const DEFAULT_TEMPERATURE = 70;

var argv = require(`yargs`)
  .options({
    projectId: {
      description:
        'Google Cloud Project ID to use.',
      requiresArg: true,
      demandOption: true,
      type: 'string'
    },
    cloudRegion: {
      default: 'us-central1',
      description: 'GCP cloud region.',
      requiresArg: true,
      type: 'string'
    },
    registryId: {
      description: 'Cloud IoT registry ID.',
      requiresArg: true,
      demandOption: true,
      type: 'string'
    },
    deviceId: {
      description: 'Cloud IoT device ID.',
      requiresArg: true,
      demandOption: true,
      type: 'string'
    },
    deviceType: {
      description: 'IoT Device type',
      requiresArg: true,
      demandOption: true,
      choices: ['light', 'thermostat'],
      type: 'string'
    },
    privateKeyFile: {
      description: 'Path to private key file.',
      requiresArg: true,
      demandOption: true,
      type: 'string'
    },
    algorithm: {
      description: 'Encryption algorithm to generate the JWT.',
      requiresArg: true,
      demandOption: true,
      choices: ['RS256', 'ES256'],
      type: 'string'
    },
    mqttBridgeHostname: {
      default: 'mqtt.googleapis.com',
      description: 'MQTT bridge hostname.',
      requiresArg: true,
      type: 'string'
    },
    mqttBridgePort: {
      default: 8883,
      description: 'MQTT bridge port.',
      requiresArg: true,
      type: 'number'
    }
  })
  .example(
    `$0 \\\n\t--projectId=blue-jet-123 --cloudRegion=us-central1 \\\n\t--registryId=my-registry --deviceId=my-node-device \\\n\t--privateKeyFile=./ec_private.pem --algorithm=ES256 \\\n\t --deviceType=light`
  )
  .wrap(120)
  .epilogue(`For more information, see https://cloud.google.com/iot-core/docs`)
  .help()
  .strict().argv;

console.log('Starting Smart Home Device');

// Create a Cloud IoT Core JWT for the given project id, signed with the given
// private key.
function createJwt(projectId, privateKeyFile, algorithm) {
  // Create a JWT to authenticate this device. The device will be disconnected
  // after the token expires, and will have to reconnect with a new token. The
  // audience field should always be set to the GCP project id.
  const token = {
    iat: parseInt(Date.now() / 1000),
    exp: parseInt(Date.now() / 1000) + TOKEN_EXP_MINS * 60,
    aud: projectId
  };
  const privateKey = fs.readFileSync(privateKeyFile);
  return jwt.sign(token, privateKey, {algorithm: algorithm});
}

// The mqttClientId is a unique string that identifies this device. For Google
// Cloud IoT Core, it must be in the format below.
const mqttClientId = `projects/${argv.projectId}/locations/${
  argv.cloudRegion
}/registries/${argv.registryId}/devices/${argv.deviceId}`;

// Publish device events back to Cloud IoT to reflect successful updates.
const mqttTopic = `/devices/${argv.deviceId}/events`;

/**
 * Initialize the MQTT client and set up event handlers for device config
 */
function initMqttClient() {
  // With Google Cloud IoT Core, the username field is ignored, however it must be
  // non-empty. The password field is used to transmit a JWT to authorize the
  // device. The "mqtts" protocol causes the library to connect using SSL, which
  // is required for Cloud IoT Core.
  const connectionArgs = {
    host: argv.mqttBridgeHostname,
    port: argv.mqttBridgePort,
    clientId: mqttClientId,
    username: 'unused',
    password: createJwt(argv.projectId, argv.privateKeyFile, argv.algorithm),
    protocol: 'mqtts',
    secureProtocol: 'TLSv1_2_method'
  };

  // Create a client, and connect to the Google MQTT bridge.
  const client = mqtt.connect(connectionArgs);

  // Subscribe to the /devices/{device-id}/config topic to receive config updates.
  // Config updates are recommended to use QoS 1 (at least once delivery)
  client.subscribe(`/devices/${argv.deviceId}/config`, {qos: 1});

  /* Handle MQTT Client Events */
  client.on('connect', success => {
    console.log('connect');
  });

  client.on('close', () => {
    console.log('close');
  });

  client.on('error', err => {
    console.error('error', err);
  });

  client.on('message', (topic, message) => {
    if (topic === `/devices/${argv.deviceId}/config`) {
      // Config update received from Cloud IoT
      try {
        const messageStr = Buffer.from(message, 'base64').toString();
        console.log(`Config message received: ${messageStr}`);
        const config = JSON.parse(messageStr);
        handleConfigUpdate(config);
      } catch (err) {
        console.error('Invalid configuration message', err);
      }
    }
  });

  return client;
}

/**
 * Handle an incoming configuration change and publish a new
 * state update.
 */
function handleConfigUpdate(config) {
  // Process incoming message
  let update;
  switch (argv.deviceType) {
    case 'light':
      update = handleLightConfig(config);
      break;
    case 'thermostat':
      update = handleThermostatConfig(config);
      break;
    default:
      console.log('Invalid device type selected');
      return;
  }

  // Publish an event to report a successful state update
  const response = Buffer.from(JSON.stringify(update));
  client.publish(mqttTopic, response, {qos: 1}, function(err) {
    if (!err) {
      console.log(`Device update published: ${response}`);
    } else {
      console.error('Unable to publish update', err);
    }
  });
}

/**
 * Locally process configuration for a light device
 */
function handleLightConfig(config) {
  if (config.on) {
    console.log(`Setting device state to ON @ ${config.brightness}`);
  } else {
    console.log('Setting device state to OFF');
  }

  return config;
}

/**
 * Locally process configuration for a thermostat device
 */
function handleThermostatConfig(config) {
  let newState = 'off';
  if (config.on) {
    newState = (config.setpoint >= DEFAULT_TEMPERATURE) ? 'heat' : 'cool';
  }

  switch (newState) {
    case 'off':
      console.log('Setting device state to OFF');
      break;
    case 'heat':
      console.log(`Setting device to HEAT @ ${config.setpoint}`);
      break;
    case 'cool':
      console.log(`Setting device to COOL @ ${config.setpoint}`);
      break;
    default:
      console.log('Invalid mode received');
      break;
  }

  return {
    mode: newState,
    setpoint: config.setpoint
  };
}

// Set a recurring task to refresh the JWT on the expiry interval
let client = initMqttClient();
setInterval(() => {
  console.log('Refreshing MQTT JWT credentials');
  client.end();
  client = initMqttClient();
}, TOKEN_EXP_MINS * 60 * 1000);
