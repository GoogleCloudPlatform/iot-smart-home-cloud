# Device Manager Web

This project contains the web front-end, written in Angular, for the
Smart Home Device Manager sample. This app allows users to view and manage
the IoT devices registered to their account.

## Quickstart

1. Add your Firebase project credentials in `environment.ts`

    ```
    export const environment = {
      ...
      firebase: {
        apiKey: "...",
        authDomain: "...",
        databaseURL: "...",
        projectId: "...",
        storageBucket: "...",
        messagingSenderId: "..."
      }
    };
    ```

1. Install the Angular CLI

  ```
  $ npm install @angular/cli
  ```

1. Build the application and start a local server instance

  ```
  $ ng serve
  ```

Open `http://localhost:4200` in your browser.
You should see the Device Manager login page.

### Deploy to Firebase

You can also deploy this application to Firebase Hosting with the rest of the
[Device Manager Cloud](../firebase/README.md) project.

1. Create a dist build of the app. The build output will appear in the
   `/firebase/public/` directory:

    ```
    $ ng build
    ```

1. Follow the instructions in the [Device Manager Cloud](../firebase/README.md)
   project to deploy.