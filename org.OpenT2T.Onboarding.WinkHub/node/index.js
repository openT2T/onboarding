'use strict';

var https = require('https');
var inquirer = require('inquirer');

// module exports, implementing the schema
module.exports = {

    onboard: function(name, idKeyFilter, successCallback, errorCallback) {
        console.log('Onboarding device  : ' + name);
        console.log('idKeyFilter        : ' + idKeyFilter);

        // build questions for credentials
        console.log('\nPlease enter credentials for the Wink API:\n');

        var questions = [
            {
                type: 'input',
                name: 'client_id',
                message: 'Wink API Client ID: ',
                validate: function(value) {
                    var pass = !!value;
                    if (pass) {
                        return true;
                    } else {
                        return 'Please enter a valid Client ID.';
                    }
                }
            },
            {
                type: 'input',
                name: 'client_secret',
                message: 'Wink API Client Secret: ',
                validate: function(value) {
                    var pass = !!value;
                    if (pass) {
                        return true;
                    } else {
                        return 'Please enter a valid Client Secret.';
                    }
                }
            },
            {
                type: 'input',
                name: 'username',
                message: 'Wink User Name (create this in the Wink app): ',
                validate: function(value) {
                    var pass = !!value;
                    if (pass) {
                        return true;
                    } else {
                        return 'Please enter a valid User Name.';
                    }
                }
            },
            {
                type: 'password',
                name: 'password',
                message: 'Wink Password (create this in the Wink app): ',
                validate: function(value) {
                    var pass = !!value;
                    if (pass) {
                        return true;
                    } else {
                        return 'Please enter a valid Password.';
                    }
                }
            }
        ];

        // show questions for credentials
        inquirer.prompt(questions, function(answers) {
            console.log('\nThanks! Signing you in to Wink.');

            var postData = JSON.stringify({
                'client_id': answers.client_id,
                'client_secret': answers.client_secret,
                'username': answers.username,
                'password': answers.password,
                'grant_type': 'password'
            });

            var postOptions = {
                protocol: 'https:',
                host: 'api.wink.com',
                path: '/oauth2/token',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': postData.length
                },
                method: 'POST'
            };

            // set up sign in request
            var req = https.request(postOptions, (res) => {

                var body = '';
                res.setEncoding('utf8');
                res.on('data', function(data) {
                    body += data;
                });

                res.on('end', function() {

                    if (res.statusCode != 200) {
                        if (errorCallback) {
                            errorCallback(res.statusCode, body);
                            return;
                        }
                    }
                    else {
                        // signed in, now enumerate devices and let the user pick one
                        var user = JSON.parse(body);
                        console.log('Signed in to WINK.');

                        var getOptions = {
                            protocol: 'https:',
                            host: 'api.wink.com',
                            path: '/users/me/wink_devices',
                            headers: {
                                'Authorization': 'Bearer ' + user.access_token,
                                'Accept': 'application/json'
                            },
                            method: 'GET'
                        };

                        var req = https.get(getOptions, function(res) {
                            var body = '';
                            res.setEncoding('utf8');
                            res.on('data', function(data) {
                                body += data;
                            });

                            res.on('end', function() {
                                if (res.statusCode != 200) {
                                    if (errorCallback) {
                                        errorCallback(res.statusCode, body);
                                        return;
                                    }
                                } else {
                                    var devices = JSON.parse(body).data;

                                    // apply the id key filter (only show devices that have this id key)
                                    devices = devices.filter(function(device) {
                                        return !!device[idKeyFilter];
                                    });

                                    if (!!devices && devices.length > 0) {
                                        var deviceChoices = devices.map(function(device) {
                                            return device.name + ' (' + device[idKeyFilter] + ')';
                                        });

                                        // ask the user to select a device
                                        inquirer.prompt([
                                            {
                                                type: "list",
                                                name: "selectedDevice",
                                                message: "Which device do you want to onboard?",
                                                choices: deviceChoices
                                            }
                                        ], function(answers) {
                                            // all done. Now we have both parameters we needed.
                                            var d = answers.selectedDevice;
                                            var deviceId = d.substring(d.lastIndexOf('(') + 1, d.lastIndexOf(')'));

                                            if (successCallback) {
                                                successCallback(user.access_token, deviceId, 'All done. Happy coding!');
                                                return;
                                            }
                                        });

                                    } else {
                                        if (errorCallback) {
                                            errorCallback('NotFound', 'No devices found.');
                                            return;
                                        }
                                    }
                                }
                            });

                            res.on('error', function(e) {
                                if (errorCallback) {
                                    errorCallback('enumerate', e.message);
                                    return;
                                }
                            });
                        });
                    }
                });

                res.on('error', function(e) {
                    if (errorCallback) {
                        errorCallback('token', e.message);
                        return;
                    }
                });

            });

            req.on('error', (e) => {
                if (errorCallback) {
                    errorCallback('token', e.message);
                    return;
                }
            });

            // initiate sign in request
            req.write(postData);
            req.end();
        });
    }
};