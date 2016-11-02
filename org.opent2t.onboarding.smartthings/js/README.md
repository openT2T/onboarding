# SmartThings Onboarding
Sample [SmartThings](http://www.smartthings.com/) onboarding module for Open Translators to Things. May be used to discover devices connected to SmartThings per the 
[org.opent2t.onboarding.smartthings.xml](https://github.com/opent2t/onboarding/blob/master/org.opent2t.onboarding.smartthings/org.opent2t.onboarding.smartthings.xml) schema.

See schema definition for inputs to the onboarding method.

## Setup
1. Go to http://developer.smartthings.com/ and register as a developer
2. Create a SmartApp (you will need the Client ID and Client Secret from this application)
3. Set the redirect URL of your application to http://127.0.0.1:8080/success (note that this is http, not https)