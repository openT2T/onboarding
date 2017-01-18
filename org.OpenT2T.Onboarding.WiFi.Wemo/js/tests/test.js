var test = require('ava');
var express = require('express');
var SsdpServer = require('node-ssdp').Server;
var Onboarding = require("../thingOnboarding");

var webServer;
var ssdpServer;
var configData = {
    location: "http://" + require('ip').address() + "/setup.xml",
    port: 80
}

test.before(t => {
    // Start a local weserver that will pretend to be a WeMo uPnP device and 
    // respond with the configuration data
    webServer = express();
    webServer.get('/setup.xml', function(req, res) {
        // Respond with XML containing minimal required data
        res.send("<root><device><deviceType>urn:Belkin:device:insight:1</deviceType><friendlyName>Fake Wemo Device</friendlyName></device></root>");
    });
    webServer.listen(configData.port);

    // Start a upnp server (device) that will be picked up in the search
    var ssdpServer = new SsdpServer({
        location: configData.location
    });

    // Pretend to be a Belkin WeMo upnp device
    ssdpServer.addUSN('urn:Belkin:service:basicevent:1');

    ssdpServer.start('0.0.0.0');
});

test.serial('discoverSsdp', t => {
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
            if (device.friendlyName == "Fake Wemo Device") {
                found = true;
            }
        }
        t.true(found, "Expecting to find Fake Wemo Device in discovered devices");
    });
});