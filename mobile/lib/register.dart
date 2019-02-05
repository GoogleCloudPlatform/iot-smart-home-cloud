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

import 'dart:typed_data';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:firebase_ml_vision/firebase_ml_vision.dart';

class RegisterDeviceScreen extends StatefulWidget {
  RegisterDeviceScreen({Key key, this.title}) : super(key: key);

  final String title;

  @override
  _RegisterDeviceState createState() => new _RegisterDeviceState();
}

enum DetectionState {empty, invalid, detected}
/// Scan a device QR code and validate its contents
class _RegisterDeviceState extends State<RegisterDeviceScreen> {
  /// MLKit vision detector for QR codes
  final BarcodeDetector _detector = FirebaseVision.instance.barcodeDetector(
    BarcodeDetectorOptions(
      barcodeFormats: BarcodeFormat.qrCode
    )
  );

  CameraController _controller;
  DetectionState _currentState = DetectionState.empty;
  bool _scanInProgess = false;
  bool _barcodeDetected = false;

  /// Callback to handle each camera frame
  void _handleCameraImage(CameraImage image) async {
    // Drop the frame if we are still scanning
    if (_scanInProgess || _barcodeDetected) return;

    _scanInProgess = true;

    // Collect all planes into a single buffer
    final WriteBuffer allBytesBuffer = WriteBuffer();
    image.planes.forEach((Plane plane) => allBytesBuffer.putUint8List(plane.bytes));
    final Uint8List allBytes = allBytesBuffer.done().buffer.asUint8List();

    // Convert the image buffer into a Firebase detector frame
    FirebaseVisionImage firebaseImage = FirebaseVisionImage.fromBytes(allBytes,
      FirebaseVisionImageMetadata(
        rawFormat: image.format.raw,
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: ImageRotation.rotation90,
        planeData: image.planes.map((plane) => FirebaseVisionImagePlaneMetadata(
          height: plane.height,
          width: plane.width,
          bytesPerRow: plane.bytesPerRow,
        )).toList(),
      ),
    );

    try {
      // Run detection and check for the proper QR code
      final List<Barcode> barcodes = await _detector.detectInImage(firebaseImage);
      if (barcodes.isEmpty) {
        _reportDetectionState(DetectionState.empty);
      } else {
        final Map<String, dynamic> device = await _handleBarcodeResult(barcodes[0]);
        _barcodeDetected = true;
        _reportDetectionState(DetectionState.detected);
        Navigator.of(context).pop(device);
      }
    } catch (error) {
      print(error);
      _reportDetectionState(DetectionState.invalid);
    } finally {
      _scanInProgess = false;
    }
  }

  /// Utility to update UI with scanner state
  void _reportDetectionState(DetectionState state) {
    if (mounted) {
      setState(() {
        _currentState = state;
      });
    }
  }

  /// Validate a QR code as device data
  Future<Map<String, dynamic>> _handleBarcodeResult(Barcode barcode) async {
    // Check for valid QR code data type
    if (barcode.valueType != BarcodeValueType.text) {
      throw("Invalid QR code type");
    }
    // Check for valid JSON payload
    Map<String, dynamic> json = jsonDecode(barcode.rawValue);
    if (json == null || json['serial_number'] == null || json['public_key'] == null || json['type'] == null) {
      throw("Not a device QR code");
    }

    return json;
  }

  @override
  void initState() {
    super.initState();
    availableCameras().then((cameras) {
      // Choose the back camera, or first available
      CameraDescription selected = cameras.firstWhere(
        (CameraDescription camera) => camera.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first);

      _controller = CameraController(selected, ResolutionPreset.low);
      _controller.initialize().then((_) {
        if (!mounted) {
          return;
        }

        _controller.startImageStream(_handleCameraImage);
        // Rebuild UI once camera is fully initialized
        setState(() {});
      });
    });
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_controller == null || !_controller.value.isInitialized) {
      return Container();
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Center(
          child: Column(
            children: [
              Padding(
                padding: EdgeInsets.all(8.0),
                child: Text('Scan device QR code',
                  style: Theme.of(context).textTheme.title),
              ),
              Expanded(
                  child: AspectRatio(
                    aspectRatio: _controller.value.aspectRatio,
                    child: CameraPreview(_controller)
                  ),
                ),
              Padding(
                padding: EdgeInsets.all(8.0),
                child: _detectionStateWidget(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detectionStateWidget() {
    switch (_currentState) {
      case DetectionState.detected:
        return Icon(Icons.check_circle,
          color: Colors.green,
          size: 48.0);
      case DetectionState.invalid:
        return Icon(Icons.cancel,
          color: Colors.red,
          size: 48.0);
      case DetectionState.empty:
      default:
        return Container(height: 48.0);
    }
  }
}