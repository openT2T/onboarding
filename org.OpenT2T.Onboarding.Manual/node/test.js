var manual = require('./index');

var argv = require('optimist')
    .usage('Usage: $0 -n [name] -u [instructions Url]')
    .demand(['n'])
    .demand(['u'])
    .argv;

// register success and error callbacks for testing purposes (these are normally populated by the runtime)    
function onSuccess(token, message) {
    console.log('  token        : ' + token);
    console.log('  message      : ' + message);

    process.exit();
};

function onError(type, message) {
    console.log('Error (' + type + '): ' + message);
    process.exit();
};

// Call onboarding with provided parameters (this is normally called by the runtime when the user initiates onboarding)
manual.onboard(argv.n, argv.u, onSuccess, onError);