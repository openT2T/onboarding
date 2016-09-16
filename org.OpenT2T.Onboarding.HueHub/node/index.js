'use strict';

/* eslint no-unused-vars: "off" */
var inquirer = require('inquirer');
var open = require('open');
var express = require('express');
var randomstring = require('randomstring');
var https = require('follow-redirects').https;
var crypto = require('crypto');

var config = {
    port: process.env.PORT || 8080,
    code_uri: 'https://api.meethue.com',
    access_token_uri: 'api.meethue.com',
    data_model_uri: 'api.meethue.com'
}

// module exports, implementing the schema
module.exports = {

    onboard: function(successCallback, errorCallback) {
        // build questions for credentials
        console.log('\nPlease enter credentials for the Hue API:\n');

        var questions = [
            {
                type: 'input',
                name: 'client_id',
                message: 'Hue API Client ID: ',
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
                message: 'Hue API Client Secret: ',
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
                name: 'device_id',
                message: 'Your Device Name: ',
                validate: function(value) {
                    var pass = !!value;
                    if (pass) {
                        return true;
                    } else {
                        return 'Please enter a valid Device Name.';
                    }
                }
            },
            {
                type: 'input',
                name: 'app_name',
                message: 'Your App Name: ',
                validate: function(value) {
                    var pass = !!value;
                    if (pass) {
                        return true;
                    } else {
                        return 'Please enter a valid App Name.';
                    }
                }
            },
            {
                type: 'input',
                name: 'app_id',
                message: 'Your App ID (Obtained from Hue): ',
                validate: function(value) {
                    var pass = !!value;
                    if (pass) {
                        return true;
                    } else {
                        return 'Please enter a valid App ID.';
                    }
                }
            }
            
        ];

        // show questions for credentials
        inquirer.prompt(questions, function(answers) {
            console.log('\nThanks! Signing you in to Hue.');
            
            var stateCode = randomstring.generate().substr(0,6);
            var authRequestUrl = 'https://api.meethue.com/oauth2/auth?';
            authRequestUrl += 'clientid=' + answers.client_id + '&';
            authRequestUrl += 'state=' + stateCode + '&';
            authRequestUrl += 'deviceid=' + answers.device_id + '&';
            authRequestUrl += 'devicename=' + 'OpenT2T' + '%20on%20' + answers.device_id + '&';
            authRequestUrl += 'appid=' + answers.app_id + '&';
            authRequestUrl += 'response_type=code';

            var app = express();

            app.get('/WindowsAtHome', function(req, res) {
                if(req.query.state == stateCode){

                    var tokenRequestURL = "/oauth2/token?";
                    tokenRequestURL += "code=" + req.query.code + "&";
                    tokenRequestURL += "grant_type=authorization_code";
                    
                    var options = {
                        'method': 'POST',
                        'hostname': 'api.meethue.com',
                        'port': null,
                        'path': tokenRequestURL
                    };
                    
                    var postReq = https.request(options, function(postRes) {
                        var buffer = '';
                        postRes.setEncoding('utf8');
                        postRes.on('data', function(data) {
                            buffer += data;
                        });
                        
                        postRes.on('end', function() {
                            if (postRes.statusCode != 401) {
                                if (errorCallback) {
                                    errorCallback(postRes.statusCode, body);
                                    return;
                                }
                            }
                            else {
                                // signed in, now enumerate devices and let the user pick one
                                console.log('Signed in to Hue!');
                                res.send('<html><body><h1>Signed in. Please close this window and return to node.</h1></body></html>');
                                
                                //Get nonce
                                var digestHeader = postRes.headers['www-authenticate'];
                                var nonce = digestHeader.substr(digestHeader.indexOf('nonce=\"')+7, 32);
                                
                                //Compute Digest Header
                                var disgestHeaderContent = 'username=\"' + answers.client_id + '\", ';
                                disgestHeaderContent += 'realm=\"oauth2_client@api.meethue.com\", ';
                                disgestHeaderContent += 'nonce=\"' + nonce + '\", ';
                                disgestHeaderContent += 'uri=\"/oauth2/token\", ';
                                var HASH1 = crypto.createHash('md5').update(answers.client_id + ':oauth2_client@api.meethue.com:' + answers.client_secret).digest('hex');
                                var HASH2 = crypto.createHash('md5').update('POST:/oauth2/token').digest('hex');
                                var authHeaderResponse = crypto.createHash('md5').update(HASH1 + ':' + nonce + ':' + HASH2).digest('hex');
                                disgestHeaderContent += 'response=\"' + authHeaderResponse + '\"';
                                
                                options.headers = {
                                        'Accept': 'application/json',
                                        'Authorization': 'Digest ' + disgestHeaderContent,
                                };
                                
                                console.log('Responding to Digest Authentication to get access token:');
                                console.log(options);
                                var accessTokenReq = https.request(options, function(accessTokenRes) {
                                    
                                    /*
                                    Getting an error after sending digest response:
                                    events.js:141
                                          throw er; // Unhandled 'error' event
                                          ^

                                    Error: socket hang up
                                        at createHangUpError (_http_client.js:213:15)
                                        at TLSSocket.socketOnEnd (_http_client.js:305:23)
                                        at emitNone (events.js:72:20)
                                        at TLSSocket.emit (events.js:166:7)
                                        at endReadableNT (_stream_readable.js:921:12)
                                        at nextTickCallbackWith2Args (node.js:442:9)
                                        at process._tickCallback (node.js:356:17) 
                                    */
                                    
                                    var body = '';
                                    accessTokenRes.on('data', function(data) {
                                        console.log(data);
                                        body += data;
                                    });

                                    accessTokenRes.on('end', function() {
                                        console.log(body.toString());
                                        
                                        if (accessTokenRes.statusCode != 200) {
                                            if (errorCallback) {
                                                errorCallback(accessTokenRes.statusCode, body);
                                                return;
                                            }
                                        } else {

                                            // retrieve access tokens
                                            var tokens = JSON.parse(body);
                                            if (successCallback) {
                                                successCallback(tokens.access_token, tokens.access_token_expires_in, tokens.refresh_token, 'All done. Happy coding!');
                                                return;

                                            }
                                            
                                            //TODO: get remote bridge ID and whitelist ID
                                        }
                                    });

                                    accessTokenRes.on('error', function(e) {
                                        if (errorCallback) {
                                            errorCallback('DigestAuth', e.message);
                                            return;
                                        }
                                    });
                                });
                            }
                        });
                        
                        postReq.on('error', function(e) {
                            if (errorCallback) {
                                errorCallback('GetNonce', e.message);
                                return;
                            }
                        });
                    });

                    postReq.end();
                    
                } else {
                    //TODO: errorCallback
                    console.log('Error in auth request: Mismatched state code in redirect url.');
                    if (errorCallback) {
                        errorCallback('AuthRequest', "Mismatched state code in redirect url");
                        return;
                    }
                }
            });

            // start the server which shows UX in a local browser
            app.listen(config.port, function() {
                console.log('Server running on port', config.port);
                open(authRequestUrl); // open the oauth UI
            });
        });
    }
};