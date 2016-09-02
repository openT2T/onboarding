var huehub = require('./index');

var argv = require('optimist')
    .usage('Usage: $0 -n [lamp name] -u [user id]')
    .default({ n : '', u : '' })
    .argv;

// register success and error callbacks for testing purposes (these are normally populated by the runtime)
function onSuccess(ipAddress, userId, uniqueId, message) {
    console.log("  ipAddress : " + ipAddress);
    console.log("  userId    : " + userId);
    console.log("  uniqueId  : " + uniqueId);
    console.log("  message   : " + message);

    process.exit();
}

function onError(type, message) {
    console.log('Error (' + type + '): ' + message);
    process.exit();
}

// Call onboarding with provided parameters (this is normally called by the runtime when the user initiates onboarding)
huehub.onboard(argv.n, argv.u, onSuccess, onError);

