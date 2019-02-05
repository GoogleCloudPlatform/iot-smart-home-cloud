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

/// Base device mode for all support device types
abstract class Device {
  Device({this.id, this.name, this.online});

  final String id;
  final String name;
  final bool online;

  factory Device.fromData(Map<String, dynamic> data, String id) {
    switch (data['type']) {
      case 'light':
        return LightDevice.fromData(data, id);
      case 'thermostat':
        return ThermostatDevice.fromData(data, id);
      default:
        throw("Invalid device type");
    }
  }

  /// Return the correct icon type for the device
  IconData get deviceIcon;
  /// Return a UI status message for the device
  String get deviceStatus;
  /// Report the initial value for the control UI
  int get setpointValue;
  /// Return a representation of the new device configuration
  Map<String, dynamic> getUpdatedValue(int setpoint);
}

/// Implementation of a smart light device
class LightDevice extends Device {
  LightDevice({String id, String name, bool online, @required this.isOn, @required this.brightness})
    : super(id: id, name: name, online: online);

  final bool isOn;
  final int brightness;

  LightDevice.fromData(Map<String, dynamic> data, String id)
    : this(
        id: id,
        name: data['name'],
        online: data['online'] && data['state'] != null,
        isOn: (data['state'] != null) ? data['state']['on'] : false,
        brightness: (data['state'] != null) ? data['state']['brightness'] : 0
      );

  @override
  IconData get deviceIcon => Icons.lightbulb_outline;

  @override
  String get deviceStatus {
    if (!this.online) {
      return 'Offline';
    }

    if (!this.isOn) {
      return 'OFF';
    }

    return "Brightness: ${this.brightness}";
  }

  @override
  int get setpointValue => this.brightness;

  @override
  Map<String, dynamic> getUpdatedValue(int newSetpoint) =>
    {
      'brightness': newSetpoint.round(),
      'on': newSetpoint > 0.0
    };
}

/// Implementation of a smart thermostat device
class ThermostatDevice extends Device {
  ThermostatDevice({String id, String name, bool online, @required this.mode, @required this.setpoint})
    : super(id: id, name: name, online: online);

  final String mode;
  final int setpoint;

  ThermostatDevice.fromData(Map<String, dynamic> data, String id)
    : this(
      id: id,
      name: data['name'],
      online: data['online'] && data['state'] != null,
      mode: (data['state'] != null) ? data['state']['mode'] : 'off',
      setpoint: (data['state'] != null) ? data['state']['setpoint'] : 0
    );

  @override
  IconData get deviceIcon => Icons.ac_unit;

    @override
  String get deviceStatus {
    if (!this.online) {
      return 'Offline';
    }

    switch(this.mode) {
      case 'off':
        return 'OFF';
      case 'heat':
        return "Heating to ${this.setpoint}";
      case 'cool':
        return "Cooling to ${this.setpoint}";
      default:
        return 'Error: Invalid mode';
    }
  }

  @override
  int get setpointValue => this.setpoint;

  @override
  Map<String, dynamic> getUpdatedValue(int newSetpoint) =>
    {
      'setpoint': newSetpoint.round(),
      'on': newSetpoint > 0.0
    };
}