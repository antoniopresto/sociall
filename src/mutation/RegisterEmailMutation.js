// @flow

import { GraphQLString, GraphQLNonNull } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { User } from '../model';
import { createJWToken } from '../auth/jwt';

export default mutationWithClientMutationId({
  name: 'RegisterEmail',
  inputFields: {
    firstName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    lastName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
    },
    password: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  mutateAndGetPayload: async ({ firstName, lastName, email, password }) => {
    let user = await User.findOne({ 'emails.value': email.toLowerCase() });

    if (user) {
      return {
        token: null,
        error: 'EMAIL_ALREADY_IN_USE',
      };
    }

    user = new User({
      emails: [{ value: email, provider: 'app' }],
      firstName,
      lastName,
      password,
    });
    const created = await user.save();

    return {
      token: createJWToken(created._id.toString()),
      error: null,
      _id: created._id.toString(),
    };
  },
  outputFields: {
    token: {
      type: GraphQLString,
      resolve: ({ token }) => token,
    },
    _id: {
      type: GraphQLString,
      resolve: ({ _id }) => _id,
    },
    error: {
      type: GraphQLString,
      resolve: ({ error }) => error,
    },
  },
});
