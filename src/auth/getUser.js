// @flow

import jwt from 'jsonwebtoken';
import { User } from '../model';
import { decodeJWToken } from './jwt';

export async function getUser(token: string) {
  if (!token) return { user: null };

  try {
    const decodedToken = decodeJWToken(token);

    const user = await User.findOne({ _id: decodedToken._id });

    return {
      user,
    };
  } catch (err) {
    return { user: null };
  }
}
