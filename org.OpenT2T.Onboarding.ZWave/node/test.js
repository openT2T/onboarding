var zwave = require('./index');

// register success and error callbacks for testing purposes (these are normally populated by the runtime)    
function onSuccess(address, message) {
    console.log("  address      : " + address);
    console.log("  message      : " + message);

    process.exit();
};

function onError(type, message) {
    console.log('Error (' + type + '): ' + message);
    process.exit();
};

// Call onboarding with test data for Somfy (this is normally called by the runtime when the user initiates onboarding)
zwave.onboard('Test Shade', '\\\\.\\COM3', 'Somfy', 37, onSuccess, onError);