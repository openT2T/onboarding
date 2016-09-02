var nest = require('./index');

var argv = require('optimist')
    .usage('Usage: $0 -n [name] -f [deviceTypeFilter]')
    .demand(['n'])
    .demand(['f'])
    .argv;

// register success and error callbacks for testing purposes (these are normally populated by the runtime)    
function onSuccess(access_token, expires_in, device_id, message) {
    console.log('  access_token : ' + access_token);
    console.log('  expires_in   : ' + expires_in);
    console.log('  device_id    : ' + device_id);
    console.log('  message      : ' + message);

    // done... exit after giving the browser enough time to flush any responses
    setTimeout(function() {
        process.exit();
    }, 3000);
}

function onError(type, message) {
    console.log('Error (' + type + '): ' + message);
    process.exit();
}

// Call onboarding with provided parameters (this is normally called by the runtime when the user initiates onboarding)
nest.onboard(argv.n, argv.f, onSuccess, onError);