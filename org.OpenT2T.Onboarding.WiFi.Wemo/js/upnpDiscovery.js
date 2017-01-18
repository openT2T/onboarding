var SSDPClient = require('node-ssdp').Client;
var q = require('q');
var http = require('http');
var Url = require('url');
var xml2js = require('xml2js');

class Discovery {
    constructor(urn) {
        this._discoveryTimeout = 10000;
        
        // If not provided, search for all ssdp devices
        if (!urn) {
            urn = "ssdp:all";
        }

        this._urn = urn;
    }

    /**
     * Uses SSDP to discover uPnP devices on the current network that response to a specific urn (or all)
     */
    discover(callback, timeout) {
        if (timeout) {
            this.__discoveryTimeout = timeout;
        }

        var deferred = q.defer();
        
        var handleSsdpResponse = function(msg, statusCode, rinfo) {
            // Get and parse the device details, and send it to the callback function
            this._getDeviceDetails(msg.LOCATION, callback);
        }.bind(this);

        // Start a search for each provider URN that is supported
        // A device may respond to more than one URN, so the caller needs to handle possible duplicate devices.
        var ssdpClient = new SSDPClient({});
        ssdpClient.removeAllListeners('response');
        ssdpClient.on('response', handleSsdpResponse);
        ssdpClient.search(this._urn);
        
        // End the search after the timeout
        setTimeout(() => {
            ssdpClient.stop();
            deferred.resolve();
        }, this._discoveryTimeout);
        
        return deferred.promise;
    }

    /**
     * Gets details from an SSDP device by performing a simple GET to the XML path provided in the
     * initial discovery.
     */
    _getDeviceDetails(fullDeviceUrl, callback) {
        var devicePath = Url.parse(fullDeviceUrl);

        // Do a get to the device
        var options = {
            host: devicePath.hostname,
            port: devicePath.port,
            path: devicePath.path,
            method: 'GET'
        }

        // Small helper for throwing request errors that are actionable.
        // This should be replaced with common erro handling in the future.
        var handleRequestError = function(errorDetail) {
            throw new Error("Unable to get device information from " + fullDeviceUrl + " error: " + errorDetail);
        }
        
        var req = http.request(options, function(res) {
            var body = "";
            res.setEncoding('utf8');

            res.on('data', function(chunk) {
                body += chunk;
            });

            res.on('end', function() {
                if (res.statusCode === 200) {
                    // The upnp device info is XML, and needs to be converted into a JSON object for
                    // portability from here on out.
                    return xml2js.parseString(body, {explicitArray: false }, function(err, result) {
                        var deviceInfo = {
                            raw: result,
                            deviceType: result.root.device.deviceType,
                            friendlyName: result.root.device.friendlyName,
                            address: fullDeviceUrl
                        }
                            
                        // Notify caller that a device was found.
                        if (callback && typeof callback === 'function') {
                            callback(deviceInfo);
                        }
                    }.bind(this));
                } else {
                    handleRequestError(res.statusCode);
                }
            }.bind(this));

            res.on('error', function(err) {
                handleRequestError(err);
            });

        }.bind(this));

        req.on('error', function(err) {
            handleRequestError(err);
        });

        req.end();
    }
}

module.exports = Discovery;