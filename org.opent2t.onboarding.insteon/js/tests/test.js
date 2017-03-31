var test = require('ava');
var testConfig = require('./testConfig');
var onboardingPath = require('path').join(__dirname, '..');
var OpenT2TLogger = require('opent2t').Logger;
var logger = new OpenT2TLogger("info");
var OpenT2T = require('opent2t').OpenT2T;
var opent2t = new OpenT2T(logger);

console.log("Test Config:");
console.log(JSON.stringify(testConfig, null, 2));

///
/// Run a series of tests to validate Insteon onboarding
///

// onboard
test.serial('onboard', t => {

    return opent2t.createTranslatorAsync(onboardingPath, 'thingOnboarding', testConfig)
        .then(onboarding => {
            // TEST: translator is valid
            t.is(typeof onboarding, 'object') && t.truthy(onboarding);

            return opent2t.invokeMethodAsync(onboarding, "org.opent2t.onboarding.insteon", "onboard", [testConfig])
                .then((accessToken) => {
                    console.log("accessToken:");
                    console.log(JSON.stringify(accessToken, null, 2));

                    // TEST: something was returned
                    t.truthy(accessToken);
                    t.truthy(accessToken.accessToken);
                });
        });
});
