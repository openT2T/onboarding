# Vera Hub Onboarding
Sample [Vera Hub](http://www.getvera.com/) onboarding module for Open Translators to Things. May be used to discover devices connected to a Vera Hub per the 
[org.OpenT2T.Onboarding.VeraHub.xml](https://github.com/openT2T/onboarding/blob/master/org.OpenT2T.Onboarding.VeraHub/org.OpenT2T.Onboarding.VeraHub.xml) schema.

See schema definition for inputs to the onboarding method, and outputs via success and error callbacks.

## Sample usage (via test.js script)
Dimmable Lights: node test -f 'Dimmable'
Lights Switch: node test -f 'BinaryLight'

-f defines the filter for the device type field.  Vera uses upnp type formats like the following:

"urn:schemas-upnp-org:device:DimmableLight:1" 
"urn:schemas-upnp-org:device:BinaryLight:1"

You can specify any part of the above as an option:
Dimmable
Light
DimmableLight

'All' is a special value which provides no filtering and will return all the devices.