var zwave = require('./index');
var argv = require('optimist')
    .usage('Usage: $0 -c [serial port (eg: COM3)] -m [manufacturer] -i [classid]')
    .default({ c:'COM3', m:null, i:0 })
    .argv;

// register success and error callbacks for testing purposes (these are normally populated by the runtime)    
function onSuccess(address, message) {
    console.log("  address      : " + address);
    console.log("  message      : " + message);

    process.exit();
}

function onError(type, message) {
    console.log('Error (' + type + '): ' + message);
    process.exit();
}

// Call onboarding to find available devices
zwave.onboard('Z-Wave device', argv.c, argv.m, argv.i, onSuccess, onError);

// Example using filter to select Somfy shade device
//zwave.onboard('Test Shade', '\\\\.\\COM3', 'Somfy', 37, onSuccess, onError);