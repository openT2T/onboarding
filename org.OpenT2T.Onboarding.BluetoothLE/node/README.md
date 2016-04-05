# Bluetooth LE Onboarding
Sample Bluetooth LE onboarding module for Open Translators to Things. May be used to discover Bluetooth LE devices per the 
[org.OpenT2T.Onboarding.BluetoothLE.xml](https://github.com/openT2T/onboarding/blob/master/org.OpenT2T.Onboarding.BluetoothLE/org.OpenT2T.Onboarding.BluetoothLE.xml) schema.

See schema definition for inputs to the onboarding method, and outputs via success and error callbacks.

## Sample usage (via test.js script)
1. Flux Smart LED light: node test -n 'Flux Smart LED light' -f '^LEDBlue*'
2. SensorTag temperature node test sensor: -n 'TI SensorTag' -f 'SensorTag'