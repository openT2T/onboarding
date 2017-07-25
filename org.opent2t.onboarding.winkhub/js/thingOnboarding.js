/* jshint esversion: 6 */
/* jshint node: true */

'use strict';
var request = require('request-promise');
var url = require('url');
var querystring = require('querystring');
var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;

class Onboarding { 
    constructor(logger) {
        this.logger = logger;
		this.authUrl = 'https://api.wink.com/oauth2';
    }
   
    onboard(authInfo) {
        // Ensure getUserInput and getDeveloperInput answers are present
        if (!authInfo || authInfo.length < 2) {
            throw new OpenT2TError(401, OpenT2TConstants.InvalidAuthInput);
        }

        this.logger.verbose("Onboarding Wink Hub");

        // Parse authInfo[1] to get the query parameters, Wink wants 'code'
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
        var requestUri = this.authUrl + '/token?' + querystring.stringify(params);
        var method = "POST";

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