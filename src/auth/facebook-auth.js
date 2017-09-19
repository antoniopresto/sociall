import { upsertUserFromFacebook } from './upsertUser';
import { parseUrl } from './utils';
import request from 'request-promise';
import ms from 'ms';
import { facebookConfig } from '../config';
import User from '../model/User';

const { client_id, client_secret, scope, redirect_uri } = facebookConfig;

/**
 * Clients can request JWT with a temporary code available
 * in redirected url after user successful login
 */
function getJWTRequestHandler(router) {
  router.get('/login', async (ctx, next) => {
    // code, "issued-at"
    const [code, iat] = (ctx.query.code || '').split('.');
    if (!iat || !code) return next();

    // expired-at
    const eat = parseInt(iat) + ms('2 minutes');
    if (eat < Date.now()) return next();

    const user = await User.findOne({
      'tokens.jwtRequestCode.value': code,
      'tokens.jwtRequestCode.iat': parseInt(iat),
    });

    if (user) {
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify({ token: user.tokens.facebook });
    }
    return next();
  });
}

/**
 * Request access_token to facebook after user logs on facebook
 * @param code - returned in url from facebook
 * @returns {Promise.<*>}
 */
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

/**
 * Request user facebook user profile
 * @param access_token
 * @returns {Promise.<*>}
 */
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

function handleOauthReturn(router) {
  // facebook uses GET instead of spec that says to use POST
  router.get('/login/facebook/return', async (ctx, next) => {
    const code = ctx.query.code; // oauth code

    const access_token = await requestResourceOwnerToken(code);
    const profile = await requestProfile(access_token);

    if (!access_token || !profile) {
      ctx.request.status = 401;
      ctx.body = 'Unauthorized';
      return next();
    }

    const result = await upsertUserFromFacebook(access_token, profile);

    if (result && result.tokens) {
      // with this code client can requests a JWT token
      const codeValue = result.tokens.jwtRequestCode.value;
      const codeIat = result.tokens.jwtRequestCode.iat;
      return ctx.redirect(`/login/?code=${codeValue}.${codeIat}`);
    }

    ctx.status = 401;
    next();
  });
}

function handleLogin(router) {
  router.all('/login/facebook', ctx => {
    const url = parseUrl({
      client_id,
      redirect_uri,
      scope,
      host: 'https://www.facebook.com/dialog/oauth',
      response_type: 'code',
    });
    ctx.redirect(url);
  });
}

export default function facebookAuth(router) {
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

  handleLogin(router);
  handleOauthReturn(router);
  getJWTRequestHandler(router);
}
