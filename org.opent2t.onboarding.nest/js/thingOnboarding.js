'use strict';
var request = require('request-promise');
var OpenT2TLogger = require('opent2t').Logger;

class Onboarding {
    constructor(logLevel = "info") { 
        this.ConsoleLogger = new OpenT2TLogger(logLevel);
    }

    onboard(authInfo) {
        this.ConsoleLogger.info('Onboarding Nest Hub');

        // this comes from the onboardFlow property 
        // as part of the schema and manifest.xml
        var params = 'client_id=' + authInfo[0].client_id;
        params = params + '&code=' + authInfo[1];
        params = params + '&client_secret=' + authInfo[0].client_secret;
        params = params + '&grant_type=authorization_code';

        // build request URI
        var requestUri = 'https://api.home.nest.com/oauth2/access_token?' + params;
        var method = 'POST';

        // Set the headers
        var headers = {
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
                var tokenInfo = JSON.parse(body);

                // Nest does not support refresh_tokens, and instead the access token has an expiration 10 years
                // in the future.

                var authTokens = {};
                authTokens['access'] = {
                    token: tokenInfo.access_token,
                    
                    // expires_in is a duration in seconds and needs to be a timestamp
                    expiration: Math.floor((new Date().getTime() / 1000) + tokenInfo.expires_in)
                }
                
                return authTokens;
            })
            .catch(function (err) {
                this.ConsoleLogger.error(`Request failed to: ${options.method}- ${options.url}`);
                this.ConsoleLogger.error(`Error : ${err.statusCode} - ${err.response.statusMessage}`);
                // todo auto refresh in specific cases, issue 74
                request.reject(err);
            });
    }
}

module.exports = Onboarding;