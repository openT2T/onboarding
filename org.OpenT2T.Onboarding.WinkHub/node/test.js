var winkhub = require('./index');

var argv = require('optimist')
    .usage('Usage: $0 -n [name] -f [idKeyFilter]')
    .demand(['n'])
    .demand(['f'])
    .argv;

// register success and error callbacks for testing purposes (these are normally populated by the runtime)    
function onSuccess(access_token, id, message) {
    console.log("  access_token : " + access_token);
    console.log("  id           : " + id);
    console.log("  message      : " + message);
    
    process.exit();
};

function onError(type, message) {
    console.log('Error (' + type + '): ' + message);
    process.exit();
};

// Call onboarding with provided parameters (this is normally called by the runtime when the user initiates onboarding)
winkhub.onboard(argv.n, argv.f, onSuccess, onError);