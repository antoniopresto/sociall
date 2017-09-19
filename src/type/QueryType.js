// @flow

import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
} from 'graphql';
import { connectionArgs, fromGlobalId } from 'graphql-relay';

import UserType from './UserType';
import { NodeField } from '../interface/NodeInterface';
import { UserLoader, TweetLoader } from '../loader';
import UserConnection from '../connection/UserConnection';
import TweetConnection from '../connection/TweetConnection';

export default new GraphQLObjectType({
  name: 'Query',
  description: 'The root of all... queries',
  fields: () => ({
    node: NodeField,
    me: {
      type: UserType,
      resolve: (root, args, context) =>
        context.user ? UserLoader.load(context, context.user._id) : null,
    },
    user: {
      type: UserType,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
      },
      resolve: (obj, args, context) => {
        const { id } = fromGlobalId(args.id);
        return UserLoader.load(context, id);
      },
    },
    users: {
      type: UserConnection.connectionType,
      args: {
        ...connectionArgs,
        search: {
          type: GraphQLString,
        },
      },
      resolve: (obj, args, context) => UserLoader.loadUsers(context, args),
    },
    tweets: {
      args: connectionArgs,
      type: TweetConnection.connectionType,
      resolve: (_, args, ctx) => TweetLoader.loadTweets(ctx, args),
    },
  }),
});
