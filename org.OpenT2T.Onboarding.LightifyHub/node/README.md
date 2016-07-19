# Osram Lightify Hub Onboarding
Sample [Osram Lightify Hub](http://www.osram.com/osram_com/products/led-technology/lightify/index.jsp) onboarding module for Open Translators to Things. May be used to discover devices connected to a Osram Lightify Hub per the 
[org.OpenT2T.Onboarding.LightifyHub.xml](https://github.com/openT2T/onboarding/blob/master/org.OpenT2T.Onboarding.LightifyHub/org.OpenT2T.Onboarding.LightifyHub.xml) schema.

See schema definition for inputs to the onboarding method, and outputs via success and error callbacks.

## Sample usage (via test.js script)
Dimmable Lights: node test -f 'Light'

-f defines the filter for the device type field.  

You can specify any part of the above as an option:
Light

'All' is a special value which provides no filtering and will return all the devices.