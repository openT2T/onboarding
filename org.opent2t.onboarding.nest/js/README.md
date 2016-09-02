# Nest Onboarding
Sample [Nest](http://www.nest.com/) onboarding module for Open Translators to Things. May be used to discover devices connected to Nest per the 
[org.OpenT2T.Onboarding.Nest.xml](https://github.com/openT2T/onboarding/blob/master/org.OpenT2T.Onboarding.Nest/org.OpenT2T.Onboarding.Nest.xml) schema.

See schema definition for inputs to the onboarding method, and outputs via success and error callbacks.

## Setup
1. Go to http://developer.nest.com and register as a developer
2. Create a Product (you will need the Product ID (client_id) and Product Secret (client_secret) from this application)
-- Nest uses Product id/secret as display names and client_id/secret in apis/urls
3. Set the redirect URL of your application to http://localhost:8080/success (note that this is http, not https)
4. Optionally, if you don't have real devices, use the [Nest Home Simulator](https://developer.nest.com/documentation/cloud/home-simulator) to create some test devices.
