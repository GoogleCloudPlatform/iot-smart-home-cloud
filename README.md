# Smart Home Device Manager

This projects contains sample code that demonstrates the use of
[Firebase](https://firebase.google.com) and Google
[Cloud IoT Core](https://cloud.google.com/iot-core/) to build a cloud service
for consumer smart home devices.

## Quickstart

### Set up Google Cloud

1. Select or create a new project in the [Google Cloud Console](https://console.cloud.google.com/cloud-resource-manager).
1. Visit the [Cloud IoT Core page](https://console.cloud.google.com/iot)
   to enable the API.
1. Follow [these instructions](https://cloud.google.com/iot/docs/how-tos/devices)
   to create a device registry and a new device entry.

   *  When creating a new device entry, generate an **ES256** key. You can find
      details on creating an ES256 key pair
      [here](https://cloud.google.com/iot/docs/how-tos/credentials/keys#generating_an_es256_key).
   *  Use `device-events` as the **Default telemetry topic**.

1. Save the project values as environment variables so you can use them later on:

   ```
   $ export PROJECT_ID=my-project
   $ export REGION=us-central1
   $ export REGISTRY=my-registry
   $ export DEVICE_ID=my-device
   $ export PRIVATE_KEY_FILE=./ec_private.pem
   ```

1. Visit the [Firebase console](https://console.firebase.google.com/) and click
   **Add Project** from the dashboard. Choose the name of your existing
   Google Cloud project under **Project name**, then select **Add Firebase**.

### Set up Actions on Google

1. Navigate to the [Actions console](http://console.actions.google.com/).
1. Select **Add/import project**.
1. Choose the name of your existing Google Cloud project under **Project name**,
   then select **IMPORT PROJECT**.
1. Choose **Home control**, followed by **Smart home**.
1. Select **Setup** → **Invocation** and give your action a name.
1. Create a unique client id and secret that you will assign to Google for use
   during smart home account linking.

   ```
   $ export CLIENT_ID=my-client-id
   $ export CLIENT_SECRET=my-client-secret
   ```

> NOTE: These values enable the Google Assistant to identify itself to your action
  during account linking. This is not used to identify any particular user.

### Deploy project modules

1. Deploy the server module to Firebase using the instructions in
   [Device Manager Cloud](firebase/README.md).
1. Deploy the web application using the instructions in
   [Device Manager Web](web/README.md).
1. Deploy the mobile application using the instructions in
   [Device Manager Mobile](mobile/README.md).
1. Run a [virtual sample device](sample-device/README.md) as either a light or
   thermostat using the private key generated in the previous step.

### Complete smart home setup

1. Navigate to the [Actions console](http://console.actions.google.com/),
   and select the your project.
1. [Configure account linking](https://developers.google.com/actions/identity/oauth2?oauth=code#configure_the_project) for your action.
   Set **Linking type** to **OAuth** → **Authorization Code**, then enter the
   following **Client Information**:

   *  **Client ID:** Value exported as `CLIENT_ID` during initial setup.
   *  **Client secret:** Value generated for `CLIENT_SECRET` during initial setup.
   *  **Authorization URL:** `https://<your-firebase-hosting-app>/link-account`
   *  **Token URL:** `https://<your-cloud-functions-url>/token`

1. Click **SAVE**.
1. [Provide fulfillment](https://developers.google.com/actions/smarthome/create#provide-fulfillment) for your action.
   Select **Build** → **Actions** from the sidebar and click **ADD YOUR FIRST ACTION**.
   Enter the following **Fulfillment URL**:

   *  `https://<your-cloud-functions-url>/fulfillment`

1. Click **DONE**.

### Testing your action

Follow [these instructions](https://developers.google.com/actions/smarthome/testing-deploying)
to enable testing for your smart home action. You can use the
[Google Home app](https://play.google.com/store/apps/details?id=com.google.android.apps.chromecast.app)
to link your account and control devices.

### Handle online status changes (Optional)

By default, the sample assumes a device is online once it begins receiving
state change events from that device. You can use the following steps to export
the MQTT logs from [Stackdriver](https://cloud.google.com/stackdriver/),
which will report connection state changes.

1. Enable logging for IoT Core Registry.
   *  Navigate to IoT Core Registries page in the Cloud Console.
   *  Click the ID of the Registry, and then click **EDIT REGISTRY** at the top of the page.
   *  Under **Stackdriver Logging**, select **Info** log level.
   *  Click Update.
1. Visit the [Stackdriver Logs](https://console.cloud.google.com/logs) in the
   Cloud Console.
1. Enter the following advanced filter:

    ```
    resource.type="cloudiot_device"
    jsonPayload.eventType="DISCONNECT" OR "CONNECT"
    ```

1. Click **CREATE EXPORT**
1. Enter a value for **Sink Name**
1. Select **Cloud Pub/Sub** for **Sink Service**
1. Create a new Cloud Pub/Sub topic called `online-state` as the
   **Sink Destination**
