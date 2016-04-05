# ZWave Onboarding
Sample ZWave onboarding module for Open Translators to Things. May be used to discover ZWave devices per the 
[org.OpenT2T.Onboarding.ZWave.xml](https://github.com/openT2T/onboarding/blob/master/org.OpenT2T.Onboarding.ZWave/org.OpenT2T.Onboarding.ZWave.xml) schema.

See schema definition for inputs to the onboarding method, and outputs via success and error callbacks.

## Sample usage (via test.js script)
node test.js -n 'Somfy Shades' -f '^Somfy*'

