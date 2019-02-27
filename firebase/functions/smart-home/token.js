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
const { auth, firestore } = require('../admin');
const jwt = require('jsonwebtoken');

/**
 * Handler to exchange authorization code for refresh token
 */
async function handleAuthorizationCode(request, response) {
  console.log("Authorization Code Grant Received");
  const jwt_secret = functions.config().smarthome.key;

  try {
    // Auth code is a Firebase ID token
    const decodedToken = await auth.verifyIdToken(request.body.code);
    // Verify UID exists in our database
    const result = await auth.getUser(decodedToken.uid);
    // Encode the user info as a JWT
    const refresh = jwt.sign({
      sub: result.uid,
      aud: functions.config().smarthome.id
    }, jwt_secret);
    // Generate an initial access token
    const access = await getAccessToken(refresh, jwt_secret);
    // Register this refresh token for the given user
    const userRef = firestore.doc(`users/${result.uid}`);
    await userRef.set({ 'refresh_token': refresh });
    // Respond with the credentials
    const credentials = {
      token_type: "Bearer",
      access_token: access,
      refresh_token: refresh,
      expires_in: 3600
    };
    console.log('Issued refresh token', credentials);
    response.status(200).send(credentials);
  } catch (error) {
    console.error('Unable to issue refresh token', error);
    response.status(400).send({ "error": "invalid_grant" });
  }
}

/**
 * Handler to obtain access token from a refresh token
 */
async function handleRefreshToken(request, response) {
  console.log("Refresh Token Grant Received");
  const jwt_secret = functions.config().smarthome.key;

  try {
    const refreshToken = request.body.refresh_token;
    // Validate token parameters
    const decodedToken = jwt.verify(refreshToken, jwt_secret);
    if (decodedToken.aud !== functions.config().smarthome.id) throw new Error(`Unexpected client_id in token: ${decodedToken.aud}`);
    // Verify UID exists in our database
    const result = await auth.getUser(decodedToken.sub);
    const userRef = firestore.doc(`users/${result.uid}`);
    const user = await userRef.get();
    // Verify incoming token matches our stored refresh token
    const validToken = user.data().refresh_token;
    if (validToken !== refreshToken) throw new Error(`Invalid refresh token received: ${refreshToken}`);

    // Obtain a new access token
    const token = await getAccessToken(refreshToken, jwt_secret);
    // Respond with the credentials
    const credentials = {
      token_type: "Bearer",
      access_token: token,
      expires_in: 3600
    };
    console.log('Issued access token', credentials);
    response.status(200).send(credentials);
  } catch (error) {
    console.error('Unable to issue access token', error);
    response.status(400).send({ "error": "invalid_grant" });
  }
}

/**
 * Exchange refresh token for access token
 */
async function getAccessToken(refreshToken, secret) {
  console.log("Obtaining access token");
  // Validate incoming token
  const decoded = jwt.verify(refreshToken, secret);
  // Re-encode with an expiration time
  return jwt.sign({
    sub: decoded.sub,
    aud: decoded.aud
  }, secret, {
      expiresIn: '1h'
    });
}

/**
 * Cloud Function: Token exchange for account linking
 */
module.exports = functions.https.onRequest(async (request, response) => {
  if (request.body.client_id !== functions.config().smarthome.id
    || request.body.client_secret !== functions.config().smarthome.secret) {
    response.status(400).send({ "error": "invalid_grant" });
    return;
  }

  if (request.body.grant_type === 'authorization_code') {
    handleAuthorizationCode(request, response);
  } else if (request.body.grant_type === 'refresh_token') {
    handleRefreshToken(request, response);
  } else {
    //Invalid request
    console.error(`Invalid request type: ${request.body.grant_type}`);
    response.status(400).send({ "error": "invalid_grant" });
  }
});