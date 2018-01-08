/*--------------------MANDATORY in order to read the file and send info-----------*/
const express = require("express")
require('dotenv').load(); //file that has keywords and usernames "environment variables"
const app = express() //accesing methods in the server side 
const session = require('express-session')
const pg = require('pg')  //include the node postgres library
const bodyParser = require("body-parser") //THis allows the info to be read and retreaved (parsing) the data. This must be used
app.use(bodyParser.urlencoded()) 
const Client = pg.Client //this is needed to use postgres 
const bcrypt = require("bcrypt")
const multer = require("multer")
var upload = multer({dest: 'images/'})
const client = new Client({ //this locates the server on the computer
    user: process.env.user,
    host: 'localhost',
    database: 'blogapp',
    port: '5432',
    password: process.env.password
}) //then this client is the command connection to the server.

client.connect()
client.query(
    `create table if not exists users(
    id serial primary key,
    username text,
    email text,
    password text);`, (err, response) => {
        if(err) throw err
    }
)
client.query(
    `create table if not exists messages(
    title text,
    message text,
    user_id integer);`
)

app.use(session({
    secret: 'secret-session',
    resave: true,
    saveUninitialized: true
}))

app.set('view engine', 'pug')//tells that the file its reading its in pug form

/*--------------gets the list from Shell to index--------*/
app.get("/", (req, res) => {
    client.query(`select * from messages;`, function(err, response) {
        res.render('index', {
            user: req.session.user
        })
    })
})

/*--------signup user and register to shell-------*/
app.get("/signup", (req, res) => {
    if(req.session.user) {
        res.send("You are already logged in")
    }
    else {
        res.render('signup')
    }
})

app.post("/signup", (req, res) => {
    var username = req.body.username
    var email = req.body.email
    var password = req.body.password
    console.log(password)
    client.query(`SELECT * FROM users WHERE username = '${username}';`)
        .then(result => {
            /*username, email taken*/
            if (result.rows.length !== 0) {
                res.send("Username already taken")
            } else {
                debugger
                /*bcrypt password(hash and salt)*/
                var salt = bcrypt.genSalt(10, function(err, salt) { /*you have to create the salt and then add it to the bcrypt*/
                    bcrypt.hash(`${req.body.password}`, salt, function(err, hash) {
                        client.query(`INSERT INTO users (username, email, password) values ('${username}','${email}','${hash}') RETURNING *;`)
                        .then(response => {
                            req.session.user = {
                                username:  response.rows[0].username,
                                id: response.rows[0].id
                            }
                            res.redirect('/profile')
                        })
                        .catch(e=>{
                            console.log("ERRORsingup ", e)
                        })
                    })
                })
            }
        })
        .catch(error => {
            console.log("You fucked up!!: " + error)
        })
})

/*-------Login------*/

require("./routes/login.js")(app)

app.post('/logout', function (req, res) {
  req.session.destroy();
  console.log("Logged Out")
  res.render('index');
});

/*------post message adn send to shell------*/
app.get("/postmessage", (req, res) => {
    res.render('postmessage', {
        user: req.session.user
    })
})

app.post("/postmessage", (req, res) => {
    var title = req.body.title
    var message = req.body.message
    var password = req.body.password
    client.query(
        `INSERT INTO messages (title, message, user_id) 
        values ('${title}','${message}', 
        (SELECT users.id FROM users WHERE username = '${req.session.user.username}'));`, 
        function (err, response) { 
        if(err) {
            console.log("ERROR", err)
        }
        res.redirect('/profile')
    })
})

app.get("/bulletin", (req, res) => {
    if(req.session.user) {
        client.query(`SELECT * FROM messages;`, function (err, response) {
            if (err) throw err;
            var messages = response.rows
                res.render('bulletin', {
                    user:req.session.user,
                    messages:messages
                })
        })    
    }
    else {
        res.redirect('/login')
    }
})

app.get("/profile", (req, res) => {
    if(req.session.user) {
        client.query(`Select messages.title, messages.message FROM messages WHERE messages.user_id = ${req.session.user.id}`, function (err, response) {
            if(err) throw err;
                var messages = response.rows
                res.render('profile', {
                    user:req.session.user,
                    messages:messages
                })
        })
    } 
    else {
        res.redirect('/signup')
    }
})

/*--------connect to your localhost---------*/
app.listen(process.env.webport, function() {
    console.log("Listening on port", process.env.webport)
})
