const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const request = require('request');

const MongoClient = mongodb.MongoClient;
const Server = mongodb.Server;

const app = express();
const port = 5003;
const mongoContainerName = 'alleys-db';

// Parse JSON in incoming request bodys
app.use(bodyParser.json());


// Endpoint to view roster
app.get('/roster', async (req, res) => {
  try {
    // Get all rows
    const svr = new Server(mongoContainerName, 27017);
    const con = await MongoClient.connect(svr);
    const col = con.db('alleys').collection('roster');
    const dbRes = await col.find().toArray();
    con.close();
    // Response with 'Success' and JSON
    res.status(200).json(dbRes).end();
  } catch (e) {
    console.log(e);
    // Respond with 'Internal Server Error'
    res.status(500).end();
  }
});


// Middleware to check that the sender is allowed to create/edit the driver
app.use('/roster/:driverUsername', (req, res, next) => {
  try {
    // Retrieve JWT header
    const authHeader = req.headers.authorization;
    // Request session object from auth service
    const options = {
      uri: 'http://alleys-authentication:5001/session',
      json: true,
      headers: {'Authorization': authHeader}
    };
    request.get(options, (authErr, authRes, authBody) => {
      if (authErr) {
        throw(authErr);
      }
      if (authRes.statusCode == 401) {
        // Respond with 'Unauthorised'
        return res.status(401).end();
      }
      // Check session object username matches url username
      if (authBody.username != req.params.driverUsername) {
        // Respond with 'Unauthorised'
        return res.status(401).end();
      }
      next();
    });
  } catch (e) {
    console.log(e);
    // Respond with 'Internal Server Error'
    res.status(500).end();
  }
});


// Endpoint to add/change a single roster entry
app.put('/roster/:driverUsername', async (req, res) => {
  try {
    // Ensure correct inputs
    const username = req.params.driverUsername;
    const rate = parseInt(req.body.rate);
    if (!(username && rate)) {
      // Respond with 'Unprocessable Entity'
      return res.status(422).end();
    }
    // Upsert data
    const svr = new Server(mongoContainerName, 27017);
    const con = await MongoClient.connect(svr);
    const col = con.db('alleys').collection('roster');
    const dbRes = await col.updateOne(
      {username: username},
      {$set: {rate: rate}},
      {upsert: true}
    );
    con.close();
    // Respond with 'No Content' (Success)
    res.status(204).end();
  } catch (e) {
    console.log(e);
    // Respond with 'Internal Server Error'
    res.status(500).end();
  }
});


// Endpoint to remove a single roster entry
app.delete('/roster/:driverUsername', async (req, res) => {
  try {
    // Ensure correct input
    const username = req.params.driverUsername;
    if (!(username)) {
      // Respond with 'Unprocessable Entity'
      return res.status(422).end();
    }
    // Delete row with username
    const svr = new Server(mongoContainerName, 27017);
    const con = await MongoClient.connect(svr);
    const col = con.db('alleys').collection('roster');
    const dbRes = await col.deleteOne(
      {username: username}
    );
    con.close();
    // Respond with 'No Content' (Success)
    res.status(204).end();
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