'use strict';

var inquirer = require('inquirer');
var open = require('open');
var express = require('express');
var request = require('request');
var randomstring = require('randomstring');
var https = require('follow-redirects').https;

// Application Configuration
var config = {
    port: process.env.PORT || 8080,
    code_uri: 'https://home.nest.com',
    access_token_uri: 'api.home.nest.com'
}

// module exports, implementing the schema
module.exports = {

    onboard: function(name, deviceTypeFilter, successCallback, errorCallback) {
        console.log('Onboarding device  : ' + name);
        console.log('deviceTypeFilter        : ' + deviceTypeFilter);

        // build questions for credentials
        console.log('\nPlease enter credentials for the Nest API (from developer.nest.com):\n');

        var questions = [
            {
                type: 'input',
                name: 'client_id',
                message: 'Nest API Client ID: ',
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
                message: 'Nest API Client Secret: ',
                validate: function(value) {
                    var pass = !!value;
                    if (pass) {
                        return true;
                    } else {
                        return 'Please enter a valid Client Secret.';
                    }
                }
            }
        ];

        // show questions for credentials
        inquirer.prompt(questions, function(answers) {
            console.log('\nThanks! Initiating Nest sign-in.');

            var state = randomstring.generate();

            var authorization_url = config.code_uri + '/login/oauth2?client_id=' + answers.client_id + '&state=' + state;
            var app = express();

            app.get('/success', function(req, res) {

                // parse response from Nest (authorization_code)
                var code = req.query.code;

                var params = 'client_id=' + answers.client_id + '&code=' + code + '&client_secret=' + answers.client_secret + '&grant_type=authorization_code';

                // Swap authorization code for access token
                var options = {
                    "method": "POST",
                    "hostname": "api.home.nest.com",
                    "port": null,
                    "path": "/oauth2/access_token?" + params,
                    "headers": {
                        "cache-control": "no-cache"
                    }
                };

                var postReq = https.request(options, function(postRes) {
                    var chunks = [];

                    postRes.on("data", function(chunk) {
                        chunks.push(chunk);
                    });

                    postRes.on("end", function() {
                        var body = Buffer.concat(chunks);

                        if (postRes.statusCode != 200) {
                            if (errorCallback) {
                                errorCallback(postRes.statusCode, body);
                                return;
                            }
                        }
                        else {
                            // signed in, now enumerate devices and let the user pick one
                            console.log('Signed in to Nest!');

                            res.send('<html><body><h1>Signed in. Please close this window and return to node.</h1></body></html>');

                            var accessToken = JSON.parse(body);

                            var getOptions = {
                                protocol: 'https:',
                                host: 'developer-api.nest.com',
                                path: '/devices/' + deviceTypeFilter,
                                headers: {
                                    'Authorization': 'Bearer ' + accessToken.access_token
                                },
                                method: 'GET'
                            };

                            var getReq = https.get(getOptions, function(getRes) {
                                var body = '';
                                getRes.setEncoding('utf8');
                                getRes.on('data', function(data) {
                                    body += data;
                                });

                                getRes.on('end', function() {
                                    if (getRes.statusCode != 200) {
                                        if (errorCallback) {
                                            errorCallback(getRes.statusCode, body);
                                            return;
                                        }
                                    } else {

                                        // the devices object is not an array, each device is a key
                                        var devices = JSON.parse(body)
                                        var deviceIds = Object.keys(devices);

                                        if (!!devices && deviceIds.length > 0) {

                                            var deviceChoices = deviceIds.map(function(deviceId) {
                                                return devices[deviceId].name + ' (' + deviceId + ')';
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
                                                    successCallback(accessToken.access_token, deviceId, accessToken.expires_in, 'All done. Happy coding!');
                                                    return;
                                                }
                                            });

                                        } else {
                                            if (errorCallback) {
                                                errorCallback('NotFound', 'No devices found that match the provided device type filter: ' + deviceTypeFilter);
                                                return;
                                            }
                                        }
                                    }
                                });

                                getRes.on('error', function(e) {
                                    if (errorCallback) {
                                        errorCallback('enumerate', e.message);
                                        return;
                                    }
                                });
                            });
                        }
                    });
                });

                postReq.end();
            });

            // start the server which shows UX in a local browser
            app.listen(config.port, function() {
                console.log('Server running on port', config.port);

                // open the oauth UI
                open(authorization_url);
            });
        });
    }
};