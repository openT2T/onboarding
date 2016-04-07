# Nest Onboarding
Sample [Nest](http://www.nest.com/) onboarding module for Open Translators to Things. May be used to discover devices connected to Nest per the 
[org.OpenT2T.Onboarding.Nest.xml](https://github.com/openT2T/onboarding/blob/master/org.OpenT2T.Onboarding.Nest/org.OpenT2T.Onboarding.Nest.xml) schema.

See schema definition for inputs to the onboarding method, and outputs via success and error callbacks.

## Setup
1. Go to http://developer.nest.com and register as a developer
2. Create an application (you will need the client_id and client_secret from this application)
3. Set the redirect URL of your application to http://localhost:8080/success (note that this is http, not https)
4. Optionally, if you don't have real devices, use the [Nest Home Simulator](https://developer.nest.com/documentation/cloud/home-simulator) to create some test devices.

## Sample usage (via test.js script)
1. Thermostats: node test -n 'Nest Thermostat' -f 'thermostats'
2. Smoke/CO Alarms: node test -n 'Nest Protect' -f 'smoke_co_alarms'
3. Cameras: node test -n 'Nest Cam' -f 'cameras'
