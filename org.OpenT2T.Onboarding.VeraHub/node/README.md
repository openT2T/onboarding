# Wink Hub Onboarding
Sample [Wink Hub](http://www.wink.com/) onboarding module for Open Translators to Things. May be used to discover devices connected to a Wink Hub per the 
[org.OpenT2T.Onboarding.WinkHub.xml](https://github.com/openT2T/onboarding/blob/master/org.OpenT2T.Onboarding.WinkHub/org.OpenT2T.Onboarding.WinkHub.xml) schema.

See schema definition for inputs to the onboarding method, and outputs via success and error callbacks.

## Sample usage (via test.js script)
1. Lights: node test -n 'Wink Light Bulb' -f 'light_bulb_id'
2. Window Shades: node test -n 'Wink Window Shade' -f 'shade_id'

