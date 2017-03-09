'use strict';
var request = require('request-promise');
var url = require('url');
var querystring = require('querystring');
var OpenT2TLogger = require('opent2t').Logger;
var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;

class Onboarding {
    constructor(logLevel = "info") { 
        this.ConsoleLogger = new OpenT2TLogger(logLevel);
        this.authUrl = 'https://api.home.nest.com/oauth2';
        this.permissionsUrl = 'https://home.nest.com/login/oauth2';
    }

    onboard(authInfo) {
        // Ensure getDeveloperInput and getUserPermissions answers are present
        if (!authInfo || authInfo.length < 2) {
            throw new OpenT2TError(401, OpenT2TConstants.InvalidAuthInput);
        }
        
        this.ConsoleLogger.info('Onboarding Nest Hub');

        // Parse authInfo[1] to get the query parameters, Nest wants 'code'
        var code = url.parse(authInfo[1], true).query['code'];

        // this comes from the onboardFlow property 
        // as part of the schema and manifest.xml
        var params = {
            client_id: authInfo[0].client_id,
            client_secret: authInfo[0].client_secret,
            code: code,
            grant_type: 'authorization_code'
        }

        // build request URI
        var requestUri = this.authUrl + '/access_token?' + querystring.stringify(params);
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
            });
    }

    /**
     * Gets the user permission URL for authorizing this app on the users account.
     * The URL will be built with other answers from the onboarding flow.
     */
    getUserVerificationUri(authInfo) {
        var parameters = {
            client_id: authInfo[0].client_id,
        };

        // State will be passed back to the redirect_url unchanged, allowing an app
        // to differentiate between different users/sessions.
        if (authInfo[0].state) {
            parameters.state = authInfo[0].state;
        }

        // Automatically encode/escape any of the parameters for use in the URL
        let fullUrl = this.permissionsUrl + '?' + querystring.stringify(parameters);

        return Promise.resolve(fullUrl);
    }
}

module.exports = Onboarding;