'use strict';

var https = require('https');
var inquirer = require('inquirer');
var hubDevice = require('./hub.js');

function handleDevices(hubInfo, deviceTypeFilter, successCallback, errorCallback) 
{
    console.log("[Lightify] handleDevices (" + deviceTypeFilter + ")");

    var devices = hubInfo.devices; 

    if (deviceTypeFilter !== "All")
    {
        var lowerCaseFilter = deviceTypeFilter.toLowerCase();
        // apply the id key filter (only show devices that have this id key)
        devices = devices.filter(function(device) {
            return device.deviceType.toLowerCase().indexOf(lowerCaseFilter) >= 0;
        });
    }

    if (deviceTypeFilter === "All")
    {
        hubDevice.printDevices(devices);
    }

    if (!!devices && devices.length > 0) {
        var deviceChoices = devices.map(function(device) {
            return device.name + ' (' + device.deviceId + ')';
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
                successCallback(hubDevice.securityToken, deviceId, 'All done, happy coding!');
                return;
            }
        });
    }
    else
    {
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
        console.log('\nPlease enter credentials for the Osram Lightify API:\n');

        // show questions for credentials
        inquirer.prompt(hubDevice.inputNeeded, function(answers) {
            console.log('\nThanks! Signing you in to Osram Lightify.');

            hubDevice.connect(answers).then(function (){
                handleDevices(hubDevice, deviceTypeFilter, successCallback, errorCallback); 
            },
            function (error) {
                if (errorCallback) {
                    errorCallback('Error', error);
                }
            });
        });
    }
};