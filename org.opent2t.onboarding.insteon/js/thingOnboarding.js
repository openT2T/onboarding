'use strict';
var request = require('request-promise');
var url = require('url');
var querystring = require('querystring');
var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;

class Onboarding {
    constructor(logger) {
        this.logger = logger;
        this.authUrl = 'https://connect.insteon.com/api/v2/oauth2';
    }

    onboard(authInfo) {
        // Ensure getUserInput and getDeveloperInput answers are present
        if (!authInfo || authInfo.length < 2) {
            throw new OpenT2TError(401, OpenT2TConstants.InvalidAuthInput);
        }

        this.logger.info('Onboarding Insteon Hub');

         // Parse authInfo[1] to get the query parameters, Insteon wants 'code'
        var code = url.parse(authInfo[1], true).query['code'];

        // this comes from the onboardFlow property
        // as part of the schema and manifest.xml
        var params = {
            client_id: authInfo[0].client_id,
            client_secret: authInfo[0].client_secret,
            redirect_uri: authInfo[0].redirect_url,
            code: code,
            grant_type: 'authorization_code'
        }

        // build request URI
        var requestUri = this.authUrl + '/token';
        var method = "POST";

        // Set the headers
        var headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        var options = {
            url: requestUri,
            method: method,
            headers: headers,
            body: querystring.stringify(params)
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
                    client_id: authInfo[0].client_id
                };

                authTokens['refresh'] = {
                    token: tokenInfo.refresh_token,
                    expiration: expiration
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
        let fullUrl = this.authUrl + '/auth?' + querystring.stringify(parameters);

        return Promise.resolve(fullUrl);
    }
}

module.exports = Onboarding;