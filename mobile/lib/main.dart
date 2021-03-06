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

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'login.dart';
import 'devices.dart';
import 'register.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(DeviceManagerApp());
}

class DeviceManagerApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Device Manager',
      // Start the app at the login screen
      initialRoute: '/',
      routes: {
        '/': (context) => LoginScreen(title: 'Login'),
        '/devices': (context) => DeviceListScreen(title: 'Registered Devices'),
        '/register': (context) => RegisterDeviceScreen(title: 'Add New Device'),
      },
    );
  }
}
