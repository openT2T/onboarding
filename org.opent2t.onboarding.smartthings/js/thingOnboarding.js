'use strict';
var request = require('request-promise');
var url = require('url');
var querystring = require('querystring');
var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;

class Onboarding {
    constructor(logger) { 
        this.logger = logger;
        this.authUrl = "https://graph.api.smartthings.com/oauth";
    }

    onboard(authInfo) {
        // Ensure getDeveloperInput (0) and askUserPermission (1) answers are present
        if (!authInfo || authInfo.length < 2) {
            throw new OpenT2TError(401, OpenT2TConstants.InvalidAuthInput);
        }

        this.logger.info('Onboarding SmartThings Hub');

        // Parse authInfo[1] to get the query parameters, SmartThings wants 'code'
        var code = url.parse(authInfo[1], true).query['code'];

        // this comes from the onboardFlow property 
        // as part of the schema and manifest.xml
        var params = {
            client_id: authInfo[0].client_id,
            client_secret: authInfo[0].client_secret,
            redirect_uri: authInfo[0].redirect_url,
            code: code,
            scope: 'app',
            grant_type: 'authorization_code'
        }

        // build request URI
        var requestUri = this.authUrl + '/token?' + querystring.stringify(params);
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

    /**
     * Gets the verification URI for the user to visit, and connect the client_id
     * with their account, as per oAuth2
     */
    getUserVerificationUri(authInfo) {
        var parameters = {
            client_id: authInfo[0].client_id,
            redirect_uri: authInfo[0].redirect_url,
            scope: 'app',
            response_type: 'code'
        };

        // Automatically encode/escape any of the parameters for use in the URL
        let fullUrl = this.authUrl + '/authorize?' + querystring.stringify(parameters);

        return Promise.resolve(fullUrl);
    }
}

module.exports = Onboarding;