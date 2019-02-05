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

   > NOTE: Save the project id, registry id, device id, private key,
     and telemetry topic name. You will need these values later on.

1. Visit the [Firebase console](https://console.firebase.google.com/) and click
   **Add Project** from the dashboard. Choose the name of your existing
   Google Cloud project under **Project name**, then select **Add Firebase**.

### Deploy project modules

1. Deploy the server module to Firebase using the instructions in
   [Device Manager Cloud](firebase/README.md).
1. Deploy the web application using the instructions in
   [Device Manager Web](web/README.md).
1. Deploy the mobile application using the instructions in
   [Device Manager Mobile](mobile/README.md).
1. Run a [virtual sample device](sample-device/README.md) as either a light or
   thermostat using the private key generated in the previous step.

### Handle online status changes (Optional)

By default, the sample assumes a device is online once it begins receiving
state change events from that device. You can use the following steps to export
the MQTT logs from [Stackdriver](https://cloud.google.com/stackdriver/),
which will report connection state changes.

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
