// setting up the node-postgres driver
var pg = require('pg');
var client = new pg.Client({
    user: 'chrislocasto',
    database: 'twitter'
});

// connecting to the `postgres` server
client.connect();

// make the client available as a Node module
module.exports = client;