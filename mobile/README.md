# Device Manager Mobile

This project contains the mobile app, written in Flutter, for the
Smart Home Device Manager sample. This app alows users to register a new device,
view their existing devices, and send control commands.

## Quickstart

1. Follow [these instructions](https://firebase.google.com/docs/android/setup) to
   add an Android app to your Firebase project. Copy the `google-services.json` file
   into the `android/app` directory of the this project.
1. Follow [these instructions](https://firebase.google.com/docs/ios/setup) to
   add an iOS app to your Firebase project. Copy the `GoogleService-Info.plist` file
   into the `ios/Runner` directory of this project.
1. Deploy the app to your Android or iOS device.

> NOTE: This app uses the camera to scan QR codes. For best results, test on a physical
device and not on a simulator/emulator.

## Using the app

### Generate a device QR code

Generate a `TEXT` QR code containing the following JSON to represent the IoT device:

```
{
    "serial_number":"<Unique device id>",
    "type":"light",
    "public_key":"<ES256 Public Key>"
}
```

> NOTE: This example uses the ES256 key because it is more concise than RS256,
  allowing the key data to fit onto a QR code that is still easy to scan.

The `public_key` field should include just the Base64 encoded bytes of the key without
any additional PEM formatting. For example, if the following PEM file is uploaded to
Cloud IoT Core:
```
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4InTLsvDq9KmIW7zbL5cVOnpdHtr
XR8+vMqKIgpS82Ts1f+NdRVEFCMkO0xl/sMKrJutb2szryHWyt7th92CQw==
-----END PUBLIC KEY-----
```

Then the `public_key` JSON field should be:
```
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4InTLsvDq9KmIW7zbL5cVOnpdHtrXR8+vMqKIgpS82Ts1f+NdRVEFCMkO0xl/sMKrJutb2szryHWyt7th92CQw==
```

### Register a new device

1. Sign in with your Google account
1. Click the **Add** button to register a new device
1. Scan the device QR code

After the device has been successfully verified with Cloud IoT Core and
written to Firestore, it will appear in the device list.

### Send commands

1. Sign in with your Google account
1. Tap one of the devices in the list
1. Select a new state level for that device, and tap **Send Command**

If the device is online, the state will update immediately.
If the device is offline, the state is persisted and will be delivered to the
device as soon as it reconnects to Cloud IoT Core.