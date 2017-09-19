import { createJWToken } from './jwt';
import User from '../model/User';

/**
 * Create or update signed user and token
 * @param accessToken
 * @param profile
 * @returns {Promise.<*>}
 */
export async function upsertUserFromFacebook(accessToken, profile) {
  const email = profile.email;
  const query = { 'emails.value': email };
  const user = await User.findOne(query);

  // used to request app jwt after social login. Should expire
  const jwtRequestCode = {
    value: createJWToken(Date.now()).split('.')[0],
    iat: Date.now(),
  };

  // user already exists
  if (user) {
    const token = createJWToken(user._id.toString());
    const updateUserData = {
      $set: {
        updatedAt: new Date(),
        'socialProfiles.facebook': profile,
        'tokens.facebook': accessToken,
        'tokens.jwt': token,
        'tokens.jwtRequestCode': jwtRequestCode,
      },
    };

    const updateResult = await User.update(query, updateUserData);
    const updated = await User.findOne(query);
    updated.updateResult = updateResult.result;
    updated.jwt = token;
    return updated;
  }

  const newUser = new User({
    emails: [{ value: email, provider: 'facebook' }],
    firstName: profile.first_name,
    lastName: profile.last_name,
    tokens: {
      facebook: accessToken,
      jwtRequestCode,
    },
    socialProfiles: { facebook: profile },
  });

  const updateResult = await newUser.save();
  const created = await User.findOne(query);
  const token = createJWToken(created._id.toString());

  // set jwt token to the created user
  User.update(query, {
    $set: { 'tokens.jwt': token },
  });

  created.jwt = token;
  created.updateResult = updateResult.result;
  return created;
}
