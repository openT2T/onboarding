# Hue Onboarding
Sample [Hue](http://www.meethue.com/) onboarding module for Open Translators to Things. May be used to discover devices connected to Hue per the 
[org.opent2t.onboarding.hue.xml](https://github.com/opent2t/onboarding/blob/master/org.opent2t.onboarding.hue/org.opent2t.onboarding.hue.xml) schema.

See schema definition for inputs to the onboarding method.

## Setup
1. Go to http://www.developers.meethue.com/ and register as a developer.
2. Apply access for Hue's remote API at http://www.developers.meethue.com/content/remoteapi-terms-use. After the process completes, you will get a Consumer Key(client_id) and Consumer Secret (client_secret) and App ID (app_id) for your app from Philips Hue.
3. You can set the redirect URL of your application to http://localhost:8080/success (note that this is http, not https)
4. Obtain the access_code following the directions under the section "Authorization request" at http://www.developers.meethue.com/documentation/remote-api-authentication.
