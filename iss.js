// ISS Spotter I
// Function makes an API request to retrive the user's IP address
// /**
//  * Makes a single API request to retrieve the user's IP address.
//  * Input:
//  *   - A callback (to pass back an error or the IP string)
//  * Returns (via Callback):
//  *   - An error, if any (nullable)
//  *   - The IP address as a string (null if error). Example: "162.245.144.188"
//  * it should pass through the error to the callback if an error occurs when requesting the IP data
// * parse and extract the IP address using JSON and then pass that through to the callback (as the second argument) if there is no error
//  */
const request = require('request');

const fetchMyIP = function(callback) {
  request('https://api.ipify.org?format=json', (error, response, body) => {
    //inside the request callback
    //error can be set if invalid comain, user is offline
    if (error) return callback(error, null);

    //If non-200 status, assume server error
    if (response.statusCode !== 200) {
      callback(Error(`Status Code ${response.statusCode} when fetching IP: ${body}`), null);
      return;
    }

    //if we get here, all's well and we got the data

    const ip = JSON.parse(body).ip;
    callback(null, ip);
  });
};

// ISS Spotter II
// Function uses IP retrieved from fetchMyIP to retrieve geolocation
//  * Makes a single API request to retrieve the lat/lng for a given IPv4 address.
//  * Input:
//  *   - The ip (ipv4) address (string)
//  *   - A callback (to pass back an error or the lat/lng object)
//  * Returns (via Callback):
//  *   - An error, if any (nullable)
//  *   - The lat and lng as an object (null if error). Example:
//  *     { latitude: '49.27670', longitude: '-123.13000' }
//  */

const fetchCoordsByIP = function(ip, callback) {
  request(`https://freegeoip.app/json/${ip}`, (error, response, body) => {
    if (error) {
      callback(error, null);
      return;
    }

    if (response.statusCode !== 200) {
      callback(Error(`Status Code ${response.statusCode} when fetching Coordinates for IP: ${body}`), null);
      return;
    }

    const { latitude, longitude } = JSON.parse(body);
    callback(null, { latitude, longitude });
  });
};

// ISS Spotter III
// Function uses geolocation from fetchCoordsByIP to retrieve ISS fly times
//  * Makes a single API request to retrieve upcoming ISS fly over times the for the given lat/lng coordinates.
//  * Input:
//  *   - An object with keys `latitude` and `longitude`
//  *   - A callback (to pass back an error or the array of resulting data)
//  * Returns (via Callback):
//  *   - An error, if any (nullable)
//  *   - The fly over times as an array of objects (null if error). Example:
//  *     [ { risetime: 134564234, duration: 600 }, ... ]
//  */

const fetchISSFlyOverTimes = function(coords, callback) {
  const url = `https://iss-pass.herokuapp.com/json/?lat=${coords.latitude}&lon=${coords.longitude}`;

  request(url, (error, response, body) => {
    if (error) {
      callback(error, null);
      return;
    }

    if (response.statusCode !== 200) {
      callback(Error(`Status Code ${response.statusCode} when fetching ISS pass times: ${body}`), null);
      return;
    }

    const passes = JSON.parse(body).response;
    callback(null, passes);
  });
};

//ISS Spotter IV
/** Function will orchestrate all three API requests by "chaining" them one after another. When the first request completes, the next one will be triggered.
Orchestrates multiple API requests in order to determine the next 5 upcoming ISS fly overs for the user's current location.
 * Input:
 *   - A callback with an error or results.
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly-over times as an array (null if error):
 *     [ { risetime: <number>, duration: <number> }, ... ]
 */
const nextISSTimesForMyLocation = function(callback) {
  fetchMyIP((error, ip) => {
    if (error) {
      return callback(error, null);
    }
 
    fetchCoordsByIP(ip, (error, loc) => {
      if (error) {
        return callback(error, null);
      }
 
      fetchISSFlyOverTimes(loc, (error, nextPasses) => {
        if (error) {
          return callback(error, null);
        }
 
        callback(null, nextPasses);
      });
    });
  });
};
 
module.exports = {
  fetchMyIP,
  fetchCoordsByIP,
  fetchISSFlyOverTimes,
  nextISSTimesForMyLocation
};