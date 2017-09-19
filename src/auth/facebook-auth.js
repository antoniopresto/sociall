import { upsertUserFromFacebook } from './upsertUser';
import { parseUrl } from './utils';
import request from 'request-promise';
import ms from 'ms';
import { client_id, client_secret, scope, redirect_uri } from './config';

/**
 * Clients can request JWT with a temporary code available
 * in redirected url after user successful login
 */
function getJWTRequestHandler(app, database) {
  app.get('/login', async (req, res, next) => {
    // code, "issued-at"
    const [code, iat] = (req.query.recover || '').split('.');
    // above we don't return error information
    // if tries to recover with invalid data
    if (!iat || !code) return next();

    // expired-at
    const eat = parseInt(iat) + ms('2 minutes');
    if (eat < Date.now()) return next();

    const users = database.collection('app_users');
    const user = await users.findOne({
      'tokens.jwtRequestCode.value': code,
      'tokens.jwtRequestCode.iat': parseInt(iat),
    });

    if (user) return res.end(user.tokens.jwt);
    return next();
  });
}

async function requestResourceOwnerToken(code) {
  let token;

  // get fb token
  try {
    const getTokenUrl = parseUrl({
      host: 'https://graph.facebook.com/v2.10/oauth/access_token',
      client_secret,
      redirect_uri,
      client_id,
      code,
    });

    const response = await request.get(getTokenUrl);
    token = JSON.parse(response).access_token;
  } catch (err) {
    return null;
  }

  return token;
}

async function requestProfile(access_token) {
  let profile;

  // get profile data (email, etc)
  try {
    const profileUrl = parseUrl({
      access_token,
      host: 'https://graph.facebook.com/v2.10/me',
      fields: 'id,name,first_name,last_name,email',
    });

    const prof_response = await request.get(profileUrl);
    profile = JSON.parse(prof_response);
  } catch (err) {
    console.log(err.message);
    return null;
  }

  return profile;
}

function handleOauthReturn(app, database) {
  // facebook uses GET instead of spec that says to use POST
  app.get('/login/facebook/return', async (req, res) => {
    const code = req.query.code; // oauth code
    const access_token = await requestResourceOwnerToken(code);
    const profile = await requestProfile(access_token);

    if (!access_token || !profile) return res.status(401).end('');

    const result = await upsertUserFromFacebook(database, access_token, profile);
    if (result && result.tokens) {
      // save jwt encrypted with cookie-session package
      if (req.session) req.session.jwt = result.jwt;

      // with this code client can requests a JWT token
      const codeValue = result.tokens.jwtRequestCode.value;
      const codeIat = result.tokens.jwtRequestCode.iat;
      return res.redirect(`/login/?code=${codeValue}.${codeIat}`);
    }

    res.status(401).end('');
  });
}

function handleLogin(app) {
  app.get('/login/facebook', (req, res) => {
    const url = parseUrl({
      client_id,
      redirect_uri,
      scope,
      host: 'https://www.facebook.com/dialog/oauth',
      response_type: 'code',
    });
    res.redirect(url);
  });
}

export default function facebookAuth({ app, database }) {
  // Oauth2 https://alexbilbie.com/guide-to-oauth-2-grants/
  // - response_type with the value code
  // - client_id with the client identifier
  // - redirect_uri with the client redirect URI.
  // - scope a space delimited list of scopes
  // - state with a CSRF token. This parameter
  //    is optional but highly recommended.
  //    You should store the value of the CSRF
  //    token in the user’s session to be validated
  //    when they return.
  // - grant_type with the value of authorization_code
  // - client_id with the client identifier
  // - client_secret with the client secret
  // - redirect_uri with the same redirect URI the user was redirect back to
  // - code with the authorization code from the query string

  handleLogin(app);
  handleOauthReturn(app, database);
  getJWTRequestHandler(app, database);
}
