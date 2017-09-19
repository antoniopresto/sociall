import { createJWToken } from './jwt';

/**
 * Create or update signed user and token
 * @param database
 * @param accessToken
 * @param profile
 * @returns {Promise.<*>}
 */
export async function upsertUserFromFacebook(database, accessToken, profile) {
  const users = database.collection('app_users');
  const email = profile.email;
  const query = { 'emails.value': email };
  const user = await users.findOne(query);

  // used to request app jwt after social login. Should expire
  const jwtRequestCode = {
    value: createJWToken(Date.now()).split('.')[0],
    iat: Date.now(),
  };

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

    const updateResult = await users.update(query, updateUserData);
    const updated = await users.findOne(query);
    updated.updateResult = updateResult.result;
    updated.jwt = token;
    return updated;
  }

  const newUserData = {
    createdAt: new Date(),
    updatedAt: new Date(),
    emails: [{ value: email, provider: 'facebook' }],
    name: {
      givenName: profile.first_name,
      familyName: profile.last_name,
    },
    displayName: `${profile.first_name} ${profile.last_name}`,
    facebookId: profile.id,
    tokens: {
      facebook: accessToken,
      jwtRequestCode,
    },
    socialProfiles: { facebook: profile },
  };

  const updateResult = await users.insert(newUserData);
  const created = await users.findOne(query);
  const token = createJWToken(created._id.toString());

  // set jwt token to the created user
  users.update(query, {
    $set: { 'tokens.jwt': token },
  });

  created.jwt = token;
  created.updateResult = updateResult.result;
  return created;
}
