'use strict';
var q = require('q');

class Onboarding {

    onboard(authInfo) {
        let deferred = q.defer();
        
        console.log("Onboarding ContosoThings Hub");
        
        // contoso hub is intentionally a noop here
        deferred.resolve(authInfo);

        return deferred.promise;
    }
}

module.exports = Onboarding;