/* jshint esversion: 6 */
/* jshint node: true */

'use strict';
var request = require('request-promise');
var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;

class Onboarding { 
    constructor(logger) {
        this.logger = logger;
    }
   
    onboard(authInfo) {
        // Ensure getUserInput and getDeveloperInput answers are present
        if (!authInfo || authInfo.length < 2) {
            throw new OpenT2TError(401, OpenT2TConstants.InvalidAuthInput);
        }

        this.logger.verbose("Onboarding Wink Hub");

        // this comes from the onboardFlow property 
        // as part of the schema and manifest.xml
        var postData = JSON.stringify({
            'client_id': authInfo[1].client_id,
            'client_secret': authInfo[1].client_secret,
            'username': authInfo[0].username,
            'password': authInfo[0].password,
            'grant_type': 'password'
        });

        // build request URI
        var requestUri = "https://api.wink.com/oauth2/token";
        var method = "POST";

        // Set the headers
        var headers = {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }

        var options = {
            url: requestUri,
            method: method,
            headers: headers,
            body: postData,
            followAllRedirects: true
        };

        return request(options)
            .then(function (body) {
                var tokenInfo = JSON.parse(body); // This includes refresh token, scope etc..
                
                // Wink doesn't return an expiration, so set it to 24 hours
                var expiration = Math.floor(new Date().getTime() / 1000) + 86400;
                // default to one year in seconds
                var refreshExpiration = Math.floor(new Date().getTime() / 1000) + 31557600;

                var authTokens = {};
                authTokens['access'] = {
                    token: tokenInfo.access_token,
                    expiration: expiration,
                    type: tokenInfo.token_type,
                    scopes: tokenInfo.scopes
                }

                authTokens['refresh'] = {
                    token: tokenInfo.refresh_token,
                    expiration: refreshExpiration,
                    type: tokenInfo.token_type,
                    scopes: tokenInfo.scopes
                };
                
                return authTokens;
            });
    }
}

module.exports = Onboarding;