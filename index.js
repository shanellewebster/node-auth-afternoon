//To begin, let's require passport and passport-auth0 into variables called passport and Auth0Strategy at the top of our index.js file.
const passport = require("passport");
const Auth0Strategy = require("passport-auth0");
const express = require("express");
const session = require("express-session");
const students = require("./students.json");
require("dotenv").config();

const app = express();

//Invoke the use method off of the app object. Pass in as an argument the invocation of session. The session invocation should take an object as an arugment with 3 key value pairs, secret with the value of any string you'd like, resave with the value of false, and saveUninitialized with the value of false.
app.use(
  session({
    secret: "meh",
    resave: false,
    saveUninitialized: false
  })
);
//Invoke the use method off of the app object. Pass in as an argument the passport variable from the top of the index.js file. passport is an object with methods that we'll use. Invoke the initialize method off of the passport object. On the next line, invoke the use method off of the app object again. Pass in as an argument the passport and invoke the session method.
app.use(passport.initialize());
app.use(passport.session());
//We can now pass passport.use() a new Auth0Strategy that uses the credentials from .env, calls back to '/login' and has a scope property with the value "openid email profile" as the first argument and a callback function as the second argument. The callback function should have the parameters accessToken, refreshToken, extraParams, profile, done and should return done invoked with the two arguments null, profile.
passport.use(
  new Auth0Strategy(
    {
      domain: process.env.DOMAIN,
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "/login",
      scope: "openid email profile"
    },
    function(accessToken, refreshToken, extraParams, profile, done) {
      // accessToken is the token to call Auth0 API (not needed in the most cases)
      // extraParams.id_token has the JSON Web Token
      // profile has all the information from the user
      return done(null, profile);
    }
  )
);
//After passport.use( strategy ) let's add passport.serializeUser and passport.deserializeUser. These methods get called after a successful login and before the success redirect. According to the passport documentation, you use serializeUser to pick what properties you want from the returned user object and you use deserializeUser to execute any necessary logic on the new version of the user object. By new version of the user object, I mean that when you call done(null, {}) in serializeUser the value of that object then becomes the value of the obj parameter in deserializeUser.

passport.serializeUser((user, done) => {
  //Since we only want the clientID, email, and name from user we'll call done with a new object instead of the entire user object. Remember, we pick what properties we want in serializeUser.
  done(null, {
    clientID: user.id,
    email: user._json.email,
    name: user._json.name
  });
});

passport.deserializeUser((obj, done) => {
  //This new object will then be passed on to deserializeUser when done is invoked. Since we don't have any additional logic to execute, simply call done with null and obj.
  done(null, obj);
});

app.get(
  "/login",
  //We'll want to call passport.authenticate and pass in a strategy type and configuration object. The strategy type will be 'auth0' since we are using an auth0 strategy.
  passport.authenticate(
    "auth0",
    //Then, in the configuration object we can specify the success and failure redirects, turn failure flash on, and force the connection type to GitHub. We can do all of these by using the following properties in the configuration object: successRedirect, failureRedirect, and connection. The success redirect should go to '/students'; The failure redirect should go to '/login'; The connection should be set to 'github'.
    {
      successRedirect: "/students",
      failtureRedirect: "/login",
      connection: "github"
    }
  )
);

function authenticated(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
}

app.get("/students", authenticated, (req, res, next) => {
  res.status(200).send(students);
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
