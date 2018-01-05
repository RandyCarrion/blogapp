const express = require ('express')
const route = express()
const session = require('express-session')
const bcrypt = require('bcrypt')
const pg = require('pg')  //include the node postgres library
const Client = pg.Client //this is needed to use postgres
const client = new Client({ //this locates the server on the computer
    user: process.env.user,
    host: 'localhost',
    database: 'blogapp',
    port: '5432',
    password: process.env.password
})
client.connect()

module.exports= (route)=> {
	route.get("/login", (req, res) => {
    	res.render('login', {
        	user:req.session.user
    	})
	})

	route.post('/login', (req, res) => {
	    var username = req.body.username
	    client.query(`SELECT * FROM users WHERE username = '${username}';`, function (err, response) {
	        if (err) throw err
	        if(response.rows.length === 0) {
	            res.redirect('/signup')
	        } 
	        else {
	            bcrypt.compare(req.body.password /*the typed password*/, response.rows[0].password /*password in DB*/, function(err, result) {
	                if(err) throw err
	                if (result == true) {
	                    req.session.user = {
	                        username:  response.rows[0].username,
	                        id: response.rows[0].id
	                    } 
	                    res.redirect('/profile')
	                } else {
	                    res.send("Wrong password")
	                }
	            })
	        }  
	    })
	})
}