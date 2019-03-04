const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();
const port = 5004;

// Parse JSON in incoming request bodys
app.use(bodyParser.json());


// Endpoint to return the best driver and price for a given journey
app.get('/bestDriver', (req, res) => {
  try {
    // Validate inputs
    if (!(req.query.start && req.query.end)) {
      // Respond with 'Unprocessable Entity'
      return res.status(422).end();
    }
    // Retrieve inputs
    const start = req.query.start;
    const end = req.query.end;
    // Get roster from roster service
    request.get('http://alleys-roster:5003/roster', {json: true}, (rosterErr, rosterRes, rosterBody) => {
      if (rosterErr) {
        throw(rosterErr);
      }
      // Retrieve the driver with the lowest rate
      let bestDriver = null;
      for (let driver of rosterBody) {
        if (!(bestDriver) || driver.rate < bestDriver.rate) {
          bestDriver = driver;
        }
      }
      // Calculate the journey price (in pence)
      if (!bestDriver) {
        // Respond with 'Success' and JSON with empty fields
        return res.status(200).json({
          driver: null,
          price: null
        }).end();
      }
      // Get route info from mapping service
      const options = {
        uri: 'http://alleys-mapping:5002/route',
        json: true,
        qs: {
          start: start,
          end: end
        }
      };
      request.get(options, (routeErr, routeRes, routeBody) => {
        if (routeErr) {
          throw(routeErr);
        }
        // Retrieve route info from response
        const routeInfo = routeBody.json.routes[0].legs[0];
        // Retrieve distance and convert from m -> km
        const routeDistance = routeInfo.distance.value/1000;
        // Calculate initial price using driver rate (p/km) and the distance (km)
        let price = bestDriver.rate*routeDistance;
        // Check whether majority of journey on 'A' roads
        let distanceOnARoads = 0;
        for (step of routeInfo.steps) {
          const instructions = step.html_instructions;
          for (let i = 0; i < instructions.length; i++) {
            if (instructions[i] == 'A' && !(isNaN(parseInt(instructions[i + 1], 10)))) {
              distanceOnARoads += (step.distance.value/1000);
              break;
            }
          }
        }
        if ((distanceOnARoads/routeDistance) >= 0.5) {
          price = price*2;
        }
        // Check if less than 5 drivers in the roster
        if (rosterBody.length < 5) {
          price = price*2;
        }
        // Check if journey starts (current time) between 23:00 and 5:00
        currentDate = new Date();
        currentHour = currentDate.getHours();
        if (currentHour >= 23 || currentHour < 5) {
          price = price*2;
        }
        // Round and convert price to pounds
        price = Math.round(price)/100;
        // Respond with 'Success' and JSON
        res.status(200).json({
          driver: bestDriver,
          price: price
        }).end();
      });
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