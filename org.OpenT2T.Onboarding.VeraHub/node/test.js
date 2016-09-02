var verahub = require('./index');

var argv = require('optimist')
    .usage('Usage: $0 -f [deviceTypeFilter]')
    .demand(['f'])
    .argv;

// register success and error callbacks for testing purposes (these are normally populated by the runtime)    
function onSuccess(sessionToken, relayServer, deviceId, message) {
    console.log("  sessionToken : " + sessionToken);
    console.log("  relayServer  : " + relayServer);
    console.log("  deviceId     : " + deviceId);
    console.log("  message      : " + message);
    
    process.exit();
}

function onError(type, message) {
    console.log('Error (' + type + '): ' + message);
    process.exit();
}

// Call onboarding with provided parameters (this is normally called by the runtime when the user initiates onboarding)
verahub.onboard(argv.f, onSuccess, onError);