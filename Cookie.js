create get route /setCookie
create a diff route with /readCookie and read the cookie you just wrote

res.cookie('cookieName', randomNumber, {maxAge: 900000, httpOnly:true}): //set cookie

var cookieparser = require('cookie-parse'); to read the cookie