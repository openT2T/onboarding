'use strict';

var OpenZWave = require('openzwave-shared');
var inquirer = require('inquirer');
var os = require('os');


// module exports, implementing the schema
module.exports = {

    onboard: function(name, zwaveStickPort, manufacturerNameFilter, deviceClassId, successCallback, errorCallback) {
        var zwavedriverroot = {
            "darwin": '/dev/',
            "linux": '/dev/',
            "win32": '\\\\.\\'
        }
        var zwaveCommunicationChannel = zwavedriverroot[os.platform()] + zwaveStickPort;

        console.log('Onboarding device            : ' + name);
        console.log('ZWave communication channel  : ' + zwaveCommunicationChannel);
        console.log('manufacturerNameFilter       : ' + manufacturerNameFilter);
        console.log('deviceClassId                : ' + deviceClassId);

        var manufacturerNameRegEx = manufacturerNameFilter ? new RegExp(manufacturerNameFilter) : null;

        var zwave = new OpenZWave({
            ConsoleOutput: false,
            Logging: false,
            SaveConfiguration: false,
            DriverMaxAttempts: 3,
            PollInterval: 500,
            SuppressValueRefresh: true,
        });
        var nodes = [];

        var hub_homeid;

        zwave.on('connected', function(homeid) {
            // console.log('=================== CONNECTED! ====================');
        });

        zwave.on('driver ready', function(homeid) {
            // console.log('=================== DRIVER READY! ====================');
            console.log('scanning homeid=0x%s...', homeid.toString(16));
            hub_homeid = homeid;
        });

        zwave.on('driver failed', function() {
            errorCallback('Driver', 'failed to start driver');
            zwave.disconnect();
            return;
        });

        zwave.on('node added', function(nodeid) {
            // console.log('=================== NODE ADDED! ========   id = ' + nodeid );
            nodes[nodeid] = {
                manufacturer: '',
                manufacturerid: '',
                product: '',
                producttype: '',
                productid: '',
                type: '',
                name: '',
                loc: '',
                classes: {},
                ready: false,
            };
        });

        zwave.on('value added', function(nodeid, comclass, value) {
            if (!nodes[nodeid]['classes'][comclass])
                nodes[nodeid]['classes'][comclass] = {};
            nodes[nodeid]['classes'][comclass][value.index] = value;
        });

        zwave.on('value changed', function(nodeid, comclass, value) {
            if (nodes[nodeid]['ready']) {
                console.log('node%d: changed: %d:%s:%s->%s', nodeid, comclass,
                    value['label'],
                    nodes[nodeid]['classes'][comclass][value.index]['value'],
                    value['value']);
            }
            nodes[nodeid]['classes'][comclass][value.index] = value;
        });

        zwave.on('value removed', function(nodeid, comclass, index) {
            if (nodes[nodeid]['classes'][comclass] &&
                nodes[nodeid]['classes'][comclass][index])
                delete nodes[nodeid]['classes'][comclass][index];
        });

        zwave.on('node ready', function(nodeid, nodeinfo) {
            nodes[nodeid]['manufacturer'] = nodeinfo.manufacturer;
            nodes[nodeid]['manufacturerid'] = nodeinfo.manufacturerid;
            nodes[nodeid]['product'] = nodeinfo.product;
            nodes[nodeid]['producttype'] = nodeinfo.producttype;
            nodes[nodeid]['productid'] = nodeinfo.productid;
            nodes[nodeid]['type'] = nodeinfo.type;
            nodes[nodeid]['name'] = nodeinfo.name;
            nodes[nodeid]['loc'] = nodeinfo.loc;
            nodes[nodeid]['ready'] = true;
            for (var comclass in nodes[nodeid]['classes']) {
                switch (comclass) {
                    case 0x25: // COMMAND_CLASS_SWITCH_BINARY
                    case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
                        zwave.enablePoll(nodeid, comclass);
                        break;
                }
                var values = nodes[nodeid]['classes'][comclass];
            }
        });

        var addressList = [];

        zwave.on('scan complete', function() {
            var deviceChoices = [];
            for (var index = 0; index < nodes.length; index++) {
                var n = nodes[index];
                if (typeof (n) !== 'undefined') {
                    if (!manufacturerNameRegEx || manufacturerNameRegEx.test(n.manufacturer)) {
                        if (!deviceClassId || typeof (n.classes[deviceClassId]) !== 'undefined') {
                            deviceChoices.push('Manufacturer: ' + n.manufacturer +
                                                ', Product: ' + n.product +
                                                ', NodeId(' + index + ')');
                        }
                    }
                }
            }

            if (deviceChoices.length > 0) {
                // ask the user to select a device
                // Note: list prompt does not work on Windows 10 unless we first have another question
                // So there is an additional prompt to hit enter key.
                inquirer.prompt([
                    {
                        type: "input",
                        name: "ok",
                        message: "Found devices. Hit enter to select device"
                    },
                    {
                        type: "list",
                        name: "selectedDevice",
                        message: "Which device do you want to onboard?",
                        choices: deviceChoices,
                        default: true
                    }
                ], function(answers) {
                    // all done. Now we have both parameters we needed.
                    var d = answers.selectedDevice;
                    var nodeId = d.substring(d.lastIndexOf('(') + 1, d.lastIndexOf(')'));
                    var address = "{\"homeId\":" + hub_homeid + ",\"nodeId\":" + nodeId + "}";

                    if (successCallback) {
                        successCallback(address, 'ZWave device(s) found');
                        return;
                    }
                });
            } else {
                if (errorCallback) {
                    errorCallback('NotFound', 'No ZWave devices found');
                    return;
                }
            }
        });

        zwave.connect(zwaveCommunicationChannel);
    }
};
