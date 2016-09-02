'use strict';

var hue = require("node-hue-api");
var HueApi = require("node-hue-api").HueApi;
var inquirer = require('inquirer');

var LightInfo = function(uniqueid, name)
{
	this.uniqueId = uniqueid;
	this.name = name;
};

var getLights = function(ipaddr, userId, callback) {
    var api = new HueApi(ipaddr, userId);
	var lights = [];
    api.lights(function(err, result) {
        if (err)
            console.log("api.lights " + err);
        else {
            for (var light of result.lights) {
				var lightInfo = new LightInfo(light.uniqueid, light.name);
                lights.push(lightInfo);
            }
			callback(lights);
            return;
        }
    });
};

var onboardLights = function(ipaddr, userId, name, successCallback, errorCallback) {
    getLights(ipaddr, userId, function(lights) {
        if (!!lights && lights.length > 0) {

            // If a name was specified, filter the list of lights by matching the name.
            if (name) {
                var nameRegexp = new RegExp(name);
                lights = lights.filter(function (light) {
                    return nameRegexp.test(light.name);
                });
            }

            if (lights.length == 1) {
                // A single light was found.
                var selectedLight = lights[0];
                if (successCallback) {
                    successCallback(ipaddr, userId, selectedLight.uniqueId, 'All done. Happy coding!');
                }
            } else if (lights.length > 1) {
                // More than one lights were found. Ask the user to select a light.
                var choices = lights.map(function (light) {
                    return JSON.stringify(light);
                });
                inquirer.prompt([
                    {
                        type: "list",
                        name: "selectedLight",
                        message: "Which light do you want to onboard?",
                        choices: choices
                    }
                ], function(answers) {
                    // All done. Now we have all the parameters we needed.
                    var selectedLight = JSON.parse(answers.selectedLight);
                    if (successCallback) {
                        successCallback(ipaddr, userId, selectedLight.uniqueId, 'All done. Happy coding!');
                    }
                });
            } else {
                if (errorCallback) {
                    errorCallback('NotFound', 'Some lights were found, but none matched the specified name.');
                }
            }
        } else {
            if (errorCallback) {
                errorCallback('NotFound', 'No lights were found.');
            }
        }
    });
}

// module exports, implementing the schema
module.exports = {

    onboard: function(name, userId, successCallback, errorCallback) {
        console.log('Onboarding device : ' + name);

        // Find a Hue bridge
        hue.nupnpSearch(function(upnpErr, result) {
            var hueBridgeInfo = result[0];
            var ipaddr = hueBridgeInfo.ipaddress;
            console.log("Found Hue bridge at " + ipaddr);

            if (userId) {
                // A user ID was specified. Go ahead and query the lights.
                onboardLights(ipaddr, userId, name, successCallback, errorCallback);
            } else {
                // Ask the user to press the button, which enables creating a new user ID.
                console.log("Important! Press the button on the top of the Hue.")
                var readline = require('readline');
                var rl = readline.createInterface(process.stdin, process.stdout);
                rl.setPrompt('Then press Enter here within 30 seconds...');
                rl.prompt();
                rl.on('line', function() {
                    var hueapi = new HueApi();
                    hueapi.createUser(ipaddr, function(err, userId) {
                        if (err) {
                            if (errorCallback) {
                            errorCallback('Create User Error', JSON.stringify(err));
                            return;
                            }
                        } else {
                            console.log("Created User: %s", userId);

                            // Now user the userId to get the lights attached to the Hue
                            onboardLights(ipaddr, userId, name, successCallback, errorCallback);
                        }
                    });
                });
            }
        });
    }
};
