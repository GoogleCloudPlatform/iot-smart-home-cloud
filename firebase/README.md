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

1. Add the Firebase config environment variables for your Cloud IoT Core project:

    ```
    $ firebase functions:config:set \
        cloudiot.region="us-central1" \
        cloudiot.registry="home-devices"
    ```

1. Deploy the Firestore config, cloud functions, and hosting files to Firebase:

    ```
    $ firebase deploy
    ```

If you previously deployed the [Device Manager Web](../web/README.md) app,
open the hosting URL displayed by the deploy command to see the Device Manager
login page.