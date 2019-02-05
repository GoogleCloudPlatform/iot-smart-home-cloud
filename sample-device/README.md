# Sample IoT Device

This project contains an example virtual device, written in Node.js, for the
Smart Home Device Manager sample. This device connects to Cloud IoT Core and
reflects every configuration message it receives back as a telemtry event.

## Quickstart

1. Install the sample dependencies:

    ```
    $ npm install
    ```

1. Copy the private key file generated from the [project Quickstart](../README.md)
   to the sample device directory.

1. Run the script, providing the private key generated in the previous step along
   with your Google Cloud project, registry, and device information:

    ```
    $ node sample_device.js
        --projectId=<your-project-id> \
        --cloudRegion=<your-cloud-region> \
        --registryId=<your-registry-id> \
        --deviceId=<your-device-id> \
        --deviceType=light \
        --privateKeyFile=./ec_private.pem \
        --algorithm=ES256
    ```
