import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { apolloServer } from 'apollo-server';
import { Strategy as GitHubStrategy } from 'passport-github';
import bodyParser from 'body-parser';
import knex from './sql/connector';

var KnexSessionstore = require('connect-session-knex')(session);
var store = new KnexSessionstore({
  knex,
});

import { schema, resolvers } from './schema';
import { GitHubConnector } from './github/connector';
import { Repositories, Users } from './github/models';
import { Entries } from './sql/models';

let PORT= 3010;

if(process.env.PORT) {
  PORT = parseInt(process.env.PORT, 10) + 100;
}

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
} = process.env;


const app = express();

app.use(session({
  secret: 'your secret',
  resave: true,
  saveUninitialized: true,
  store,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser());

app.get('/login/github',
  passport.authenticate('github'));

app.get('/login/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.use('/graphql', apolloServer((req) => {
  // Get the query, the same way express-graphql does it
  // https://github.com/graphql/express-graphql/blob/3fa6e68582d6d933d37fa9e841da5d2aa39261cd/src/index.js#L257
  const query = req.query.query || req.body.query;
  if (query && query.length > 2000) {
    console.log(query);
    // None of our app's queries are this long
    // Probably indicates someone trying to send an overly expensive query
    throw new Error('Query too large.');
  }

  let user;
  if (req.user) {
    // We get req.user from passport-github with some pretty oddly named fields,
    // let's convert that to fields in our schema, which match the GitHub API
    // field names.
    user = {
      login: req.user.username,
      html_url: req.user.profileUrl,
      avatar_url: req.user.photos[0].value,
    };
  }

  const gitHubConnector = new GitHubConnector({
    client_id: GITHUB_CLIENT_ID,
    client_secret: GITHUB_CLIENT_SECRET,
  });
  // console.log(gitHubConnector);
  return {
    graphiql: true,
    pretty: true,
    resolvers,
    schema,
    context: {
      user,
      Repositories: new Repositories({ connector: gitHubConnector }),
      Users: new Users({ connector: gitHubConnector }),
      Entries:  new Entries(),

    }
  };

}));

app.listen(PORT, () => console.log(
  `Server running at http://localhost:${PORT}`
));

const gitHubStrategyOptions = {
  clientID: "628358b61f3a2952a352",
  clientSecret: "085427d2848d2cdb57fc74602877d1d1cfe247eb",
  callbackURL: "http://localhost:5200/login/github/callback"
};

passport.use(new GitHubStrategy(gitHubStrategyOptions, (accessToken, refreshToken, profile, cb) => {
  cb(null, profile);
}));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
