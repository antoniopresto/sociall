// @flow

import 'isomorphic-fetch';

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import convert from 'koa-convert';
import cors from 'kcors';
import graphqlHttp from 'koa-graphql';
import graphqlBatchHttpWrapper from 'koa-graphql-batch';
import Router from 'koa-router';

import { schema } from './schema';
import { APP_SECRET } from './auth/jwt';
import { getUser } from './auth/getUser';
import * as loaders from './loader';
import facebookAuth from './auth/facebook-auth';

const app = new Koa();
const router = new Router();

app.keys = APP_SECRET;

const graphqlSettingsPerReq = async req => {
  const { user } = await getUser((req.header.authorization || '').substring(4));

  const dataloaders = Object.keys(loaders).reduce(
    (dataloaders, loaderKey) => ({
      ...dataloaders,
      [loaderKey]: loaders[loaderKey].getLoader(),
    }),
    {},
  );

  return {
    graphiql: true, // process.env.NODE_ENV !== 'production',
    schema,
    context: {
      user,
      req,
      dataloaders,
    },
    // extensions: ({ document, variables, operationName, result }) => {
    // console.log(print(document));
    // console.log(variables);
    // console.log(result);
    // },
    formatError: error => {
      console.log(error.message);
      console.log(error.locations);
      console.log(error.stack);

      return {
        message: error.message,
        locations: error.locations,
        stack: error.stack,
      };
    },
  };
};

const graphqlServer = convert(graphqlHttp(graphqlSettingsPerReq));

// graphql batch query route
router.all('/graphql/batch', bodyParser(), graphqlBatchHttpWrapper(graphqlServer));

// graphql standard route
router.all('/graphql', graphqlServer);

// app.use(logger());
app.use(cors());

facebookAuth(router);
app.use(router.routes()).use(router.allowedMethods());

export default app;
