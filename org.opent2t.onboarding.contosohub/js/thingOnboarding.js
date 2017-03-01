'use strict';
var q = require('q');

class Onboarding {

    onboard(authInfo) {
        console.log("Onboarding ContosoThings Hub");
        
        // contoso hub is intentionally a noop here
        return q.fcall(function() { 
            return authInfo;
        });
    }
}

module.exports = Onboarding;