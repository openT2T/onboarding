/* jshint esversion: 6 */
/* jshint node: true */

'use strict';

class accessTokenInfo {
        constructor(
            accessToken,
            refreshToken,
            tokenType, // ex: 'bearer'
            expires_in
        )
    {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
        this.expires_in = expires_in;
    }
}

module.exports.accessTokenInfo = accessTokenInfo;