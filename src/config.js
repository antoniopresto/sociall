// @flow

import path from 'path';
import dotenvSafe from 'dotenv-safe';

const root = path.join.bind(this, __dirname, '../');

dotenvSafe.load({
  path: root('.env'),
  sample: root('.env.example'),
});

// Database Settings
const dBdevelopment = process.env.MONGO_URL || 'mongodb://localhost/database';
const dBproduction = process.env.MONGO_URL || 'mongodb://localhost/database';

// Test Database Settings
// const test = 'mongodb://localhost/awesome-test';

// Export DB Settings
export const databaseConfig = process.env.NODE_ENV === 'production' ? dBproduction : dBdevelopment;

// Export GraphQL Server settings
export const graphqlPort = process.env.GRAPHQL_PORT || 5000;
export const jwtSecret = process.env.JWT_KEY || 'secret_key';

// Export twitter secret settings
export const twitterConfig = (() => {
  const objStr = process.env.TWITTER_AUTH;
  let obj = {};
  try {
    obj = JSON.parse(objStr);
  } catch (err) {
    console.warn(err);
  }

  return obj;
})();

// Facebook
export const facebookConfig = {
  client_id: process.env.FACEBOOK_LOGIN_ID,
  client_secret: process.env.FACEBOOK_LOGIN_SECRET,
  redirect_uri: `http://${process.env.ROOT_URL || 'localhost:3000'}/login/facebook/return`,
  scope: 'email,public_profile',
};
