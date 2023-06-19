const request = require('request');

/**
 * Makes a single API request to retrieve the user's IP address.
 * Input:
 *   - A callback (to pass back an error or the IP string)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The IP address as a string (null if error). Example: "162.245.144.188"
 */

const fetchMyIP = function(callback) {
  // use request to fetch IP address from JSON API
  request.get('https://api.ipify.org?format=json', (error, response, body) => {
    if (error) {
      callback(error, null);
      return;
    }

    // if non-200 status, assume server error
    if (response.statusCode !== 200) {
      const msg = `Status Code ${response.statusCode} when fetching IP. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }

    try {
      const data = JSON.parse(body);
      const ip = data.ip;
      callback(null, ip);
    } catch (error) {
      callback(error, null);
    }
  });
};

const fetchCoordsByIP = function(ip, callback) {
  // use request to fetch coordinates from ipwhois API
  request.get(`https://ipwho.is/${ip}`, (error, response, body) => {
    if (error) {
      callback(error, null);
      return;
    }

    try {
      const data = JSON.parse(body);
      if (!data.success) {
        const message = `Success status was ${data.success}. Server message says: ${data.message} when fetching for IP ${data.ip}`;
        callback(Error(message), null);
        return;
      }
      const latitude = data.latitude;
      const longitude = data.longitude;
      const coordinates = { latitude, longitude };
      callback(null, coordinates);
    } catch (error) {
      callback(error, null);
    }
  });
};

/**
 * Makes a single API request to retrieve upcoming ISS fly over times the for the given lat/lng coordinates.
 * Input:
 *   - An object with keys `latitude` and `longitude`
 *   - A callback (to pass back an error or the array of resulting data)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly over times as an array of objects (null if error). Example:
 *     [ { risetime: 134564234, duration: 600 }, ... ]
 */
const fetchISSFlyOverTimes = function(coords, callback) {
  // use request to fetch coordinates from ipwhois API
  // const { latitude, longitude } = coords;
  request.get(`https://iss-flyover.herokuapp.com/json/?lat=${coords.latitude}&lon=${coords.longitude}`, (error, response, body) => {
    if (error) {
      callback(error, null);
      return;
    }

    // if non-200 status, assume server error
    if (response.statusCode !== 200) {
      const msg = `Status Code ${response.statusCode} when fetching IP. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }

    try {
      const data = JSON.parse(body);
      const response = data.response;
      callback(null, response);
    } catch (error) {
      callback(error, null);
    }
  });
};

/**
 * Orchestrates multiple API requests in order to determine the next 5 upcoming ISS fly overs for the user's current location.
 * Input:
 *   - A callback with an error or results. 
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly-over times as an array (null if error):
 *     [ { risetime: <number>, duration: <number> }, ... ]
 */ 
const nextISSTimesForMyLocation = function(callback) {
  // Step 1: Fetch IP address
  fetchMyIP((error, ip) => {
    if (error) {
      callback(error, null);
      return;
    }

    // Step 2: Fetch coordinates using IP address
    fetchCoordsByIP(ip, (error, coords) => {
      if (error) {
        callback(error, null);
        return;
      }

      // Step 3: Fetch ISS flyover times using coordinates
      fetchISSFlyOverTimes(coords, (error, flyTimes) => {
        if (error) {
          callback(error, null);
          return;
        }

        // All steps completed successfully, pass the flyover times to the callback
        callback(null, flyTimes);
      });
    });
  });
}

module.exports = { nextISSTimesForMyLocation };