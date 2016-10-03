/* jshint esversion: 6 */
/* jshint node: true */

'use strict';
var request = require('request-promise');
var accessTokenInfo = require('./common').accessTokenInfo;
var crypto = require('crypto');

class Onboarding {

    onboard(authInfo) {
        console.log("Onboarding Hue Hub");

        // this comes from the onboardFlow property 
        // as part of the schema and manifest.xml
        var options = {
            url: "https://api.meethue.com/oauth2/token?" + 'code=' + authInfo[1] + '&grant_type=authorization_code',
            method: "POST",
            headers: {
                'cache-control': 'no-cache'
            },
            followAllRedirects: true,
        };

        return request(options)
            .then(function () {
                //Do Nothing
            })
            .catch(function (err) {
                if (err.statusCode == '401') {
                    //extract nonce code from header
                    var digestHeader = err.response.headers['www-authenticate'];
                    var nonce = digestHeader.substr(digestHeader.indexOf('nonce=\"') + 7, 32);

                    //Compute digest header response
                    var disgestHeaderContent = 'username=\"' + authInfo[0].client_id + '\", ';
                    disgestHeaderContent += 'realm=\"oauth2_client@api.meethue.com\", ';
                    disgestHeaderContent += 'nonce=\"' + nonce + '\", ';
                    disgestHeaderContent += 'uri=\"/oauth2/token\", ';
                    var HASH1 = crypto.createHash('md5').update(authInfo[0].client_id + ':oauth2_client@api.meethue.com:' + authInfo[0].client_secret).digest('hex');
                    var HASH2 = crypto.createHash('md5').update('POST:/oauth2/token').digest('hex');
                    var authHeaderResponse = crypto.createHash('md5').update(HASH1 + ':' + nonce + ':' + HASH2).digest('hex');
                    disgestHeaderContent += 'response=\"' + authHeaderResponse + '\"';

                    options.headers = {
                        'Accept': 'application/json',
                        'Authorization': 'Digest ' + disgestHeaderContent,
                    };

                    return request(options).then(function (body) {
                        var tokenInfo = JSON.parse(body); // This includes refresh token, scope etc..
                        var getOptions = {
                            url: 'https://api.meethue.com/v2/bridges',
                            method: "GET",
                            headers: {
                                'Authorization': 'Bearer ' + tokenInfo.access_token
                            },
                        };

                        console.log('Getting bridge ID associated to the account...');

                        return request(getOptions)
                            .then(function (body) {

                                //Get bridgeId
                                var bridgeIds = JSON.parse(body);
                                if (bridgeIds.length > 0) {

                                    console.log('Success.');

                                    var putOptions = {
                                        url: 'https://api.meethue.com/v2/bridges/' + bridgeIds[0].id + '/0/config',
                                        method: "PUT",
                                        headers: {
                                            'Authorization': 'Bearer ' + tokenInfo.access_token,
                                            'Content-Type': 'application/json'
                                        },
                                        json: { 'linkbutton': true }
                                    };

                                    console.log('Getting whitelist ID from bridge ' + bridgeIds[0].id + '...');

                                    return request(putOptions)
                                        .then(function (body) {
                                            //pressed link button
                                            if (typeof body[0] !== 'undefined' && typeof body[0].success !== 'undefined') {
                                                var postOptions = {
                                                    url: 'https://api.meethue.com/v2/bridges/' + bridgeIds[0].id + '/',
                                                    method: "POST",
                                                    headers: {
                                                        'Authorization': 'Bearer ' + tokenInfo.access_token,
                                                        'Content-Type': 'application/json'
                                                    },
                                                    json: { 'devicetype': authInfo[2] + ' on ' + authInfo[3] }
                                                };

                                                return request(postOptions)
                                                    .then(function (body) {
                                                        //Get whitelist ID
                                                        if (typeof body[0] !== 'undefined' && typeof body[0].success !== 'undefined') {

                                                            console.log('Success.');

                                                            return new accessTokenInfo(
                                                                tokenInfo.access_token,
                                                                tokenInfo.refresh_token,
                                                                tokenInfo.token_type,
                                                                bridgeIds[0].id,
                                                                body[0].success.username
                                                            );
                                                        } else {
                                                            var errMsg = {};
                                                            if(typeof body.error !== 'undefined') {
                                                                errMsg.statusCode = body.error.type;
                                                                errMsg.response = {
                                                                    statusMessage:  body.error.description
                                                                };
                                                            } else {
                                                                errMsg.statusCode = "500";
                                                                errMsg.response = {
                                                                    statusMessage: 'Internal Error - Failed to get whitelist ID.'
                                                                };
                                                            }
                                                            throw errMsg;
                                                        }
                                                    })
                                                    .catch(function (err) {
                                                        console.log("Request failed to: " + postOptions.method + " - " + postOptions.url);
                                                        console.log("Error            : " + err.statusCode + " - " + err.response.statusMessage);
                                                        throw err;
                                                    });
                                            } else {
                                                var errMsg = {};
                                                if(typeof body.error !== 'undefined'){
                                                    errMsg.statusCode = body.error.type;
                                                    errMsg.response = {
                                                        statusMessage:  body.error.description
                                                    };
                                                } else {
                                                    errMsg.statusCode = statusCode: "500";
                                                    errMsg.response = {
                                                        statusMessage: 'Internal Error - Failed to set link button press.'
                                                    };
                                                }
                                                throw errMsg;
                                            }
                                        })
                                        .catch(function (err) {
                                            console.log("Request failed to: " + putOptions.method + " - " + putOptions.url);
                                            console.log("Error            : " + err.statusCode + " - " + err.response.statusMessage);
                                            throw err;
                                        });

                                } else {
                                    var errMsg =  {
                                        statusCode : "500",
                                        response : {
                                            statusMessage: 'Internal Error - No bridge is associated to the account. No bridge credential was set.'
                                        }
                                    };

                                    throw errMsg;
                                }
                            })
                            .catch(function (err) {
                                console.log("Request failed to: " + getOptions.method + " - " + getOptions.url);
                                console.log("Error            : " + err.statusCode + " - " + err.response.statusMessage);
                                throw err;
                            });
                    })
                        .catch(function (err) {
                            console.log("Request failed to: " + options.method + " - " + options.url);
                            console.log("Error            : " + err.statusCode + " - " + err.response.statusMessage);
                            throw err;
                        });
                } else {
                    console.log("Request failed to: " + options.method + " - " + options.url);
                    console.log("Error            : " + err.statusCode + " - " + err.response.statusMessage);
                    throw err;
                }
            });
    }
}

module.exports = Onboarding;
