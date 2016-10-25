# Insteon Hub Onboarding
Sample [Insteon Hub](http://www.insteon.com/) onboarding module for Open Translators to Things. May be used to discover devices connected to a Insteon Hub per the 
[org.opent2t.onboarding.insteon.xml](https://github.com/opent2t/onboarding/blob/master/org.opent2t.onboarding.insteon/org.opent2t.onboarding.insteon.xml) schema.

See schema definition for inputs to the onboarding method.

## Setup
1. Go to http://www.insteon.com/developer/ and register as a developer
2. You will get an API Key (Client_ID) once the registration completes.
3. You will need your API Key (Clien ID), username and password of your Insteon account to complete the onboarding process.

## Installing Dependencies
To install dependencies for this translator, run:

```bash
npm install
```

## Running Test Automation
This translator comes with some automated tests. Here's how you can run them:

### 1. Create the `tests/testConfig.json` file
This is where you can put credentials/config to drive this test (this file is added to .gitignore
to prevent inadvertent check-in). Replace the placeholder values with the values you get at Setup.

```bash
[
  {
    "username": "<Insteon account username>",
    "password": "<Insteon account paswword>"
  },
  { "client_id": "<Client ID>" }
]
```

### 2. Run the tests

To run the test, run:

```bash
ava test.js
```
