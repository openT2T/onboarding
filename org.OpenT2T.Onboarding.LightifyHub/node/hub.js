'use strict'; 

var https = require('https');
var q = require('q');

function logError(error) {
    console.log("[Lightify] Error!");
    if (error.statusMessage) {
        console.log("[Lightify] HTTP Error: " + error.statusCode + " - " + error.statusMessage);
        console.log("[Lightify] HTTP Headers: ");
        console.log(error.headers);
    }
    else {
        console.log(error);
    }
}

var internal = {
    // global Osram Lightify constants
    lightifyBaseUrl : "us.lightify-api.org",
    lightifySessionUrl : "/lightify/services/session",
    lightifyDevicesUrl : "/lightify/services/devices/",

    deviceSerialNumber: undefined,
    username: undefined,
    password: undefined,
    securityToken: undefined,

    getSecurityToken : function () {
        var postData = JSON.stringify({
            username: this.username,
            password: this.password,
            serialNumber: this.deviceSerialNumber
        });

        return this.makeLightifyRequest(this.lightifyBaseUrl, this.lightifySessionUrl, false, false, 'POST', postData)
            .then((data) => {
                this.securityToken = data.securityToken;
                return data;
            });
    },

    getDevices : function () {
        return this.makeLightifyRequest(this.lightifyBaseUrl, this.lightifyDevicesUrl, this.securityToken, false, 'GET', undefined);
    },

    makeLightifyRequest : function (url, path, securityToken, returnRawBody, method, content) {
        console.log("[Lightify] -------------------------")
        console.log("[Lightify] method             : " + method);
        console.log("[Lightify] makeLightifyRequest: " + url)
        console.log("[Lightify] path               : " + path);
        console.log("[Lightify] securityToken      : " + securityToken);

        var deferred = q.defer();

        var requestOptions = {
            protocol: 'https:',
            host: url,
            path: path,
            method: method,
            headers: {}
        };

        if (securityToken) {
            requestOptions.headers['Authorization'] = securityToken;
        }
        else if (content) {
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.headers['Content-Length'] = content.length;
        }

        var request = https.request(requestOptions);
        
        request.on('response', function(response)  {
            var body = '';
            response.setEncoding('utf8');
            
            response.on('data', function(data) {
                body += data;
            });

            response.on('end', function() {
                if (response.statusCode != 200) {
                    deferred.reject(new Error("Invalid HTTP response: " + response.statusCode + " - " + response.statusMessage));
                } else {
                    if (returnRawBody) {
                        deferred.resolve(body);
                    }
                    else {
                        var parsedBody = JSON.parse(body);
                        deferred.resolve(parsedBody);
                    }
                }
            });

            response.on('error', function(e) {
                deferred.reject(e);
            });
        });

        request.on('error', (e) => {
            deferred.reject(e);
        });

        if (content) {
            request.write(content);
        }

        request.end();

        return deferred.promise;
    },
};

module.exports = {
    inputNeeded : [
        {
            type: 'input',
            name: 'deviceSerialNumber',
            message: 'Osram Lightify Device Serial Number (alpha-numeric without trailing -XX): ',
            validate: function(value) {
                var pass = !!value;
                if (pass) {
                    return true;
                } else {
                    return 'Please enter a valid Serial Number.';
                }
            }
        },
        {
            type: 'input',
            name: 'username',
            message: 'Osram Lightify User Name (create this in the Osram Lightify app): ',
            validate: function(value) {
                var pass = !!value;
                if (pass) {
                    return true;
                } else {
                    return 'Please enter a valid User Name.';
                }
            }
        },
        {
            type: 'password',
            name: 'password',
            message: 'Osram Lightify Password (create this in the Osram Lightify app): ',
            validate: function(value) {
                var pass = !!value;
                if (pass) {
                    return true;
                } else {
                    return 'Please enter a valid Password.';
                }
            }
        }
    ],

    // devices list as returned by the server 
    devices: undefined,

    // the is the serial number of the Lightify hub device
    deviceSerialNumber: undefined,

    // this is the oauth security token for the current session
    securityToken: undefined,

    // authorizes to the server based on the properties saved in the object 
    authorize: function() {
        // get initial set of authorization info, including account server
        return internal.getSecurityToken().then((data) => {
            // get the list of devices
            return internal.getDevices().then((devices) => {
                this.securityToken = data.securityToken;
                this.devices = devices;
                this.deviceSerialNumber = internal.deviceSerialNumber;
                return devices;
            })
        });
    },

    // connects to the hub based on the answers provided
    connect : function(answers) {
        var deferred = q.defer();

        console.log("[Lightify] connect");

        if (!answers.deviceSerialNumber && !answers.username && ! answers.password) {
            logError("Invalid input");
            setImmediate(function () { deferred.reject(new Error("Invalid input")); });
        }
        else {   
            internal.username = answers.username;
            internal.password = answers.password;
            internal.deviceSerialNumber = answers.deviceSerialNumber;
            
            this.authorize().then(function (data) { 
                deferred.resolve(data);
            }, 
            function (error) {
                logError(error);
                deferred.reject(error); 
            });
        }

        return deferred.promise;
    },

    printDevices: function (devices) {
        devices.forEach(function(device) {
            console.log(device.name + " (" + device.deviceId + ") - " + device.deviceType);
        });
    }
};