var test = require('ava');
var Onboarding = require("../thingOnboarding");

/** Discovers a Flux light Bulb
 * This test requires a physical flux bulb for detection.
 */
test.serial('discoverFlux', t => {
    t.plan(2);

    var devices = [];
    var foundDevice = function(deviceInfo) {
        console.log("");
        console.log(JSON.stringify(deviceInfo, null, 2));
        devices.push(deviceInfo);
    }

    var discovery = new Onboarding();
    return discovery.discover(foundDevice, 10000).then((d) => {
        t.true(devices.length > 0, "Expecting at least one device");

        var found = false;
        for(var i = 0; i < devices.length; i++) {
            if (devices[i].friendlyName == "Flux WiFi Bulb") {
                found = true;
            }
        }
        t.true(found, "Expecting to find at least one Flux WiFi Bulb in discovered devices");
    });
});