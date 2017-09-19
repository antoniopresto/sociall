import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql';
import { globalIdField } from 'graphql-relay';
import { NodeInterface } from '../interface/NodeInterface';

export default new GraphQLObjectType({
  name: 'Tweet',
  description: 'Twitter Post',
  fields: () => ({
    id: globalIdField('Tweet'),
    created_at: {
      type: GraphQLString,
    },
    _id: {
      type: GraphQLInt,
      resolve: obj => obj.id,
    },
    text: {
      type: GraphQLString,
    },
    username: {
      type: GraphQLString,
    },
    userDisplayName: {
      type: GraphQLString,
    },
    avatar: {
      type: GraphQLString,
    },
    url: {
      type: GraphQLString,
    },
    stringData: {
      type: GraphQLString,
    },
  }),
  interfaces: () => [NodeInterface],
});
