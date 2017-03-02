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

        this.ConsoleLogger.info('Onboarding SmartThings Hub');

        // this comes from the onboardFlow property 
        // as part of the schema and manifest.xml
        var params = 'grant_type=authorization_code&client_id=' + authInfo[0].client_id
                   + '&client_secret=' + authInfo[0].client_secret
                   + '&redirect_uri=' + authInfo[0].redirect_url
                   + '&code=' + authInfo[1]
                   + '&scope=app';

        // build request URI
        var requestUri = 'https://graph.api.smartthings.com/oauth/token?' + params;
        var method = 'POST';

        // Set the headers
        var headers = {
            'Accept': 'application/json',
            'cache-control': 'no-cache'
        }

        var options = {
            url: requestUri,
            method: method,
            headers: headers,
            followAllRedirects: true
        };

        return request(options)
            .then(function (body) {
                var tokenInfo = JSON.parse(body); // This includes refresh token, scope etc..

                var authTokens = {};
                authTokens['access'] = {
                    token: tokenInfo.access_token,
                    
                    // Conver the TTL into a timestamp
                    expiration: Math.floor((new Date().getTime() / 1000) + tokenInfo.expires_in),
                    type: tokenInfo.token_type,
                    scopes: tokenInfo.scope,

                    // SmartThings requires the client_id for the endpoint URL
                    client_id: authInfo[0].client_id
                };
                
                return authTokens;
            });
    }
}

module.exports = Onboarding;