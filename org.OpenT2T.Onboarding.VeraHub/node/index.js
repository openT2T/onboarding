'use strict';

var https = require('https');
var inquirer = require('inquirer');
var hubDevice = require('./hub.js');

function handleDevices(hubInfo, deviceTypeFilter, successCallback) 
{
    console.log("[VeraHub] handleDevices (" + deviceTypeFilter + ")");

    var devices = hubInfo.devices; 

    if (deviceTypeFilter !== "All") {
        // apply the id key filter (only show devices that have this id key)
        devices = devices.filter(function(device) {
            return device.device_type.indexOf(deviceTypeFilter) > 0;
        });
    }

    if (deviceTypeFilter === "All") {
        hubDevice.printDevices(devices);
    }

    if (!!devices && devices.length > 0) {
        var deviceChoices = devices.map(function(device) {
            return device.name + ' (' + device.id + ')';
        });

        // ask the user to select a device
        inquirer.prompt([
            {
                type: "list",
                name: "selectedDevice",
                message: "Which device do you want to onboard?",
                choices: deviceChoices
            }
        ], function(answers) {
            // all done. Now we have both parameters we needed.
            var d = answers.selectedDevice;
            var deviceId = d.substring(d.lastIndexOf('(') + 1, d.lastIndexOf(')'));

            if (successCallback) {
                successCallback(hubDevice.relaySessionToken, hubDevice.relayServer, deviceId, 'All done, happy coding!');
                return;
            }
        });
    }
    else {
        if (errorCallback) {
            errorCallback('NotFound', 'No devices found.');
            return;
        }
    }
}

// module exports, implementing the schema
module.exports = {

    onboard: function(deviceTypeFilter, successCallback, errorCallback) {
        console.log('deviceTypeFilter   : ' + deviceTypeFilter);

        // build questions for credentials
        console.log('\nPlease enter credentials for the Vera API:\n');

        // show questions for credentials
        inquirer.prompt(hubDevice.inputNeeded, function(answers) {
            console.log('\nThanks! Signing you in to Vera.');

            hubDevice.connect(answers).then(function () {
                handleDevices(hubDevice.hubInfo, deviceTypeFilter, successCallback); 
            },
            function (error) {
                if (errorCallback) {
                    errorCallback('Error', error);
                }
            });
        });
    }
};