'use strict';

var noble = require('noble');

// module exports, implementing the schema
module.exports = {

    onboard: function(name, advertisementLocalNameFilter, successCallback, errorCallback) {
        console.log('Onboarding device            : ' + name);
        console.log('advertisementLocalNameFilter : ' + advertisementLocalNameFilter);

        var advertisementLocalNameRegEx = new RegExp(advertisementLocalNameFilter);

        noble.on('stateChange', function() {
            noble.on('discover', function(peripheral) {

                console.log('found peripheral: ' + peripheral);

                if ((peripheral.advertisement != null) &&
                    (peripheral.advertisement.localName != null) &&
                    advertisementLocalNameRegEx.test(peripheral.advertisement.localName)) {

                        noble.stopScanning();

                        if (successCallback) {
                            successCallback(peripheral.id, 'All done. Happy coding!');
                        }

                        return;
                };
            });

            noble.startScanning();
        });
    }
};