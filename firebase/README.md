# Device Manager Cloud

This project contains the Firebase cloud services for the Smart Home Device Manager
sample.

## Quickstart

1. Install the Firebase CLI tools:

    ```
    $ npm install -g firebase-tools
    ```

1. Initialize the Firebase CLI and select your project:

    ```
    $ firebase login
    $ firebase init
    ```

1. Add your Cloud IoT Core project info as Firebase config environment variables:

    ```
    $ firebase functions:config:set \
        cloudiot.region=$REGION \
        cloudiot.registry=$REGISTRY
    ```

1. Add the smart home client id and secret to your Firebase config environment:

    ```
    $ firebase functions:config:set \
        smarthome.id=$CLIENT_ID \
        smarthome.secret=$CLIENT_SECRET
    ```

1. Generate a unique string to be used as the HMAC-SHA256 secret to sign and
   verify JWT tokens. Add this value to the Firebase config environment:

    ```
    $ firebase functions:config:set \
        smarthome.key="my-secret-string"
    ```

1. Deploy the Firestore config, cloud functions, and hosting files to Firebase:

    ```
    $ firebase deploy
    ```

If you previously deployed the [Device Manager Web](../web/README.md) app,
open the hosting URL displayed by the deploy command to see the Device Manager
login page.