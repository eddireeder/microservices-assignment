const express = require('express');
const bodyParser = require('body-parser');
const googleMaps = require('@google/maps');

const app = express();
const port = 5002;

// Parse JSON in incoming request bodys
app.use(bodyParser.json());

// Define google maps object
const googleMapsClient = googleMaps.createClient({
  key: 'AIzaSyCj_LXU7hanwvYaFKY5sgUlE5bOnOOhAqA'
});


// Endpoint to return the info about a route
app.get('/route', (req, res) => {
  try {
    // Validate inputs
    if (!(req.query.start && req.query.end)) {
      // Respond with 'Unprocessable Entity'
      return res.status(422).end();
    }
    // Retrieve and decode inputs
    const start = decodeURIComponent(req.query.start);
    const end = decodeURIComponent(req.query.end);
    // Request directions from Google Maps Service
    googleMapsClient.directions({
      origin: start,
      destination: end,
      mode: 'driving'
    }, (error, response) => {
      if (error) {
        throw(error);
      }
      // Respond with 'Success' and JSON
      res.status(200).json(response.json).end();
    });
  } catch (e) {
    console.log(e);
    // Respond with 'Internal Server Error'
    res.status(500).end();
  }
});


// Start listening
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});