const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const jwt = require('jwt-simple');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const spdy = require('spdy');

const MongoClient = mongodb.MongoClient;
const Server = mongodb.Server;

const app = express();
const port = 5001;
const mongoContainerName = 'alleys-db';
const secretKey = 'pleasekeepthissecret';

// Parse JSON in incoming request bodys
app.use(bodyParser.json());


// Endpoint to register a driver
app.post('/register', async (req, res) => {
  try {
    // Ensure correct inputs
    const u = req.body.username;
    const p = req.body.password;
    if (!(typeof u == 'string' && typeof p == 'string' && u.length > 0 && p.length > 0)) {
      // Respond with 'Unprocessable Entity'
      return res.status(422).end();
    }
    // Generate hash
    const h = await bcrypt.hashSync(p, 10);
    // Upsert data
    const svr = new Server(mongoContainerName, 27017);
    const con = await MongoClient.connect(svr);
    const col = con.db('alleys').collection('auth');
    const dbRes = await col.updateOne(
      {username: u},
      {$set: {password: h}},
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


// Endpoint to issue a JSON web token
app.post('/issue/:username', async (req, res) => {
  try {
    // Ensure correct inputs
    const u = req.params.username;
    const p = req.body.password;
    if (!(typeof u == 'string' && typeof p == 'string')) {
      // Respond with 'Unprocessable Entity'
      return res.status(422).end();
    }
    // Search DB
    const svr = new Server(mongoContainerName, 27017);
    const con = await MongoClient.connect(svr);
    const col = con.db('alleys').collection('auth');
    const doc = await col.findOne({username: u});
    con.close();
    // If username found, validate password
    if (doc) {
      const vld = await bcrypt.compareSync(p, doc.password);
      // If password valid, generate JWT
      if (vld) {
        const uid = {username: u};
        const tkn = jwt.encode(uid, secretKey);
        // Respond with 'Success' and JWT
        res.status(200).json(tkn).end();
      } else {
        // Respond with 'Unauthorised'
        res.status(401).end();
      }
    } else {
      // Respond with 'Unauthorised'
      res.status(401).end();
    }
  } catch (e) {
    console.log(e);
    // Respond with 'Internal Server Error'
    res.status(500).end();
  }
});


// Endpoint retrieve the payload/session object of a given JWT
app.get('/session', (req, res) => {
  try {
    // Retrieve JWT
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] == 'Bearer') {
      // Assume token presented as => "Authorization: Bearer <token>"
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.decode(token, secretKey);
      // Respond with 'Success' and JWT
      res.status(200).json(decoded).end();
    } else {
      // Respond with 'Unauthorised'
      res.status(401).end();
    }
  } catch (e) {
    console.log(e);
    // Respond with 'Internal Server Error'
    res.status(500).end();
  }
});


// Create server
const server = spdy.createServer({
  key: fs.readFileSync('certificates/key.pem'),
  cert: fs.readFileSync('certificates/cert.pem')
}, app);

// Start listening
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});