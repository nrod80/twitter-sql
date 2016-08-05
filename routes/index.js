'use strict';
var express = require('express');
var router = express.Router();
var client = require('../db/index');


module.exports = function makeRouterWithSockets(io) {

    // a reusable function
    function respondWithAllTweets(req, res, next) {

        var tweetBankQuery = 'SELECT tweets.id as tweetid, userid, name, pictureurl, content FROM tweets JOIN users ON tweets.userid = users.id ';

        // execute a query on our database
        client.query(tweetBankQuery, function(err, result) {
            if (err) throw err;

            var tweets = result.rows;
            res.render('index', {
                title: 'Twitter.js',
                tweets: tweets,
                showForm: true
            });
        });
    }

    // here we basically treet the root view and tweets view as identical
    router.get('/', respondWithAllTweets);
    router.get('/tweets', respondWithAllTweets);

    // single-user page
    router.get('/users/:username', function(req, res, next) {

        var userTweetQuery = 'SELECT tweets.id as tweetid, userid, name, pictureurl, content FROM tweets JOIN users ON tweets.userid = users.id WHERE userid = $1';

        client.query(userTweetQuery, [req.params.username.toString()], function(err, result) {
            if (err) throw err;

            res.render('index', {
                title: 'Twitter.js',
                tweets: result.rows,
                username: result.rows[0].name,
                showForm: true
            });
        });

    });

    // single-tweet page
    router.get('/tweets/:id', function(req, res, next) {

        var userTweetQuery = 'SELECT tweets.id as tweetid, userid, name, pictureurl, content FROM tweets JOIN users ON tweets.userid = users.id WHERE tweets.id = $1';

        client.query(userTweetQuery, [req.params.id], function(err, result) {
            if (err) throw err;

            res.render('index', {
                title: 'Twitter.js',
                tweets: result.rows,
                username: result.rows[0].name,
                showForm: true
            });
        });
    });

    // create a new tweet
    router.post('/tweets', function(req, res, next) {
        var userId;
        var tweetId;
        client.query('SELECT id FROM users WHERE name = $1', [req.body.name], function(err, result) {
            if (err) throw err;
            // console.log('CONSOLE1: ' + result.rows[0].id);
            if (result.rows[0]) {
                userId = result.rows[0];
                addTweet();
                return;
            } else {
                userId = false;
                addUser();
            }
        });
        var newTweetQuery = 'INSERT INTO tweets (userid, content) VALUES ($1, $2)';
        var newUserQuery = 'INSERT INTO users (name, pictureurl) VALUES ($1, $2)';

        function addUser() {
            client.query(newUserQuery, [req.body.name, 'http://www.adweek.com/socialtimes/files/2012/03/twitter-egg-icon.jpg'], function(err, data) {
                if (err) {
                    console.log('Error creating user.');
                    throw err;
                }
                client.query('SELECT id FROM users WHERE name=$1', [req.body.name], function(err, data) {
                    if (err) throw err;
                    // console.log('DATA: ' + data + '\n ROWS: ' + data.rows);
                    userId = data.rows[0];
                    addTweet();
                });
            });
        }

        function addTweet() {
            client.query(newTweetQuery, [userId.id, req.body.content], function(err, data) {
                if (err) {
                    console.log('Error posting tweet.');
                    throw err;
                }
                emitTweet();
            });
        }

        function emitTweet() {
            var newTweet;
            client.query('SELECT name, tweets.id as id, content FROM tweets JOIN users ON users.id=tweets.userid', function(err, results) {
                if (err) throw err;
                newTweet = results.rows.pop()
                console.log('New Tweet: ' + newTweet);
                io.sockets.emit('new_tweet', newTweet);
                res.redirect('/');
            })

        }



    });
    // // replaced this hard-coded route with general static routing in app.js
    // router.get('/stylesheets/style.css', function(req, res, next){
    //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
    // });

    return router;
}