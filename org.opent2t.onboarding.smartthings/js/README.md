# SmartThings Onboarding
This is a sample [SmartThings](http://www.smartthings.com/) onboarding module for Open Translators to Things. It may be used to discover devices connected to SmartThings per the 
[org.opent2t.onboarding.smartthings.xml](https://github.com/opent2t/onboarding/blob/master/org.opent2t.onboarding.smartthings/org.opent2t.onboarding.smartthings.xml) schema.

See schema definition for inputs to the onboarding method.

## Setup
1. Go to http://developer.smartthings.com/ and register as a developer
2. Create a SmartApp (you will need the Client ID and Client Secret from this application)
3. Set the redirect URL of your application to http://127.0.0.1:8080/success (note that this is http, not https)

## Installing Dependencies
To install dependencies, run:
 
```bash
npm install
```

## Running the Unit Test
### 1. Get the Authorization Code
1. Open a web brower. Copy and paste the following URL into the address bar:
`
https://graph.api.smartthings.com/oauth/authorize?response_type=code&client_id={client_id}&redirect_uri=http://127.0.0.1&scope=app
`
2. Replace `{clien_id}` in the URL with the Client ID of your app. Press the "Enter" key.
3. A web page would appear asking for your permission to grant device access to the app. Select the devices you would like your app to control and click "Authorize".
4. You will be redirected to a web page with the address `http://127.0.0.1/?code=<Authorization Code>`. Save the `<Authorization Code>` for the next step.


### 2. Create the `tests/testConfig.json` file
Under the `test` folder, create a file named `testConfig.json`(this file is added to .gitignore to prevent inadvertent check-in). The testConfig.json file for onboarding the hub should be in the format below:
```
[
  {
    "client_id": "<Client ID>",
    "client_secret": "<Client Secret>,
    "redirect_url": "http://127.0.0.1"
  },
  "<Authorization Code>"
]
```
### 3. Run the tests
Navigate to the `test` folder and run:

```bash
ava test.js
```
If the test succeed, you will get the credentials to access the hub in JSON format. The credentails will be formmated like this:
```
{
  "accessToken": "<Access Token>",
  "clientId": "<Client ID>",
  "toketype": "bearer",
  "ttl": <Time to Live>,
  "scope": "app"
}
```
