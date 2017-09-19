import Tweets from '../model/Tweet';
import {
  connectionFromMongoCursor,
  mongooseLoader,
} from '@entria/graphql-mongoose-loader';
import DataLoader from 'dataloader';

export const load = async (context, id) => {
  if (!id) return null;

  let data = null;
  try {
    data = await context.dataloaders.TweetLoader.load(id);
  } catch (err) {
    return null;
  }

  return data;
};

export const getLoader = () =>
  new DataLoader(ids => mongooseLoader(Tweets, ids));

export const clearCache = ({ dataloaders }, id) =>
  dataloaders.TweetLoader.clear(id.toString());

export const loadTweets = (context, args) => {
  const argLimit = args.limit ? parseInt(args.limit) : 10;
  const limit = argLimit > 0 && argLimit < 101 ? argLimit : 100;

  const tweets = Tweets.find({})
    .sort({ createdAt: -1 })
    .limit(limit);

  return connectionFromMongoCursor({
    cursor: tweets,
    context,
    args,
    loader: load,
  });
};
