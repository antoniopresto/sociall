const jwt = require('jsonwebtoken');
const APP_SECRET = process.env.APP_SECRET || 'insecure_0.0'; // TODO check and throw error

export function createJWToken(userOrID) {
  const _id = typeof userOrID === 'string' ? userOrID : userOrID._id && userOrID._id.toString();
  return jwt.sign({ _id }, APP_SECRET);
}

export function decodeJWToken(token) {
  return jwt.verify(token, APP_SECRET);
}
