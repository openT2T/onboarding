'use strict';
var request = require('request-promise');
var OpenT2TLogger = require('opent2t').Logger;
var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;

class Onboarding {
    constructor(logLevel = "info") { 
        this.ConsoleLogger = new OpenT2TLogger(logLevel);
    }
    
    onboard(authInfo) {
        // Ensure getUserInput and getDeveloperInput answers are present
        if (!authInfo || authInfo.length < 2) {
            throw new OpenT2TError(401, OpenT2TConstants.InvalidAuthInput);
        }
        
        this.ConsoleLogger.info('Onboarding Insteon Hub');

        // this comes from the onboardFlow property 
        // as part of the schema and manifest.xml
        var postData = JSON.stringify({
            'client_id': authInfo[1].client_id,
            'username': authInfo[0].username,
            'password': authInfo[0].password,
            'grant_type': 'password'
        });

        // Set the headers
        var headers = {
            'Content-Type': 'application/json',
            'Content-Length': postData.length,
            'Accept': 'application/json'
        }

        var options = {
            url: 'https://connect.insteon.com/api/v2/oauth2/token',
            method: 'POST',
            headers: headers,
            body: postData,
            followAllRedirects: true
        };

        return request(options)
            .then(function (body) {
                var tokenInfo = JSON.parse(body); // This includes refresh token, scope etc..

                var expiration = Math.floor((new Date().getTime() / 1000) + tokenInfo.expires_in);

                var authTokens = {};
                authTokens['access'] = {
                    token: tokenInfo.access_token,
                    expiration: expiration, 
                    type: tokenInfo.token_type,
                    client_id: authInfo[1].client_id
                };

                authTokens['refresh'] = {
                    token: tokenInfo.refresh_token,
                    expiration: expiration
                };

                return authTokens;
            });
    }
}

module.exports = Onboarding;