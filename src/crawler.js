import Twitter from 'twitter';
import { twitterConfig } from './config';
import Tweet from './model/Tweet';
const client = new Twitter(twitterConfig);

const INTERVAL = 1000 * 60;

function _(o, qs) {
  const qa = qs.replace(/\[([0-9]*)]/gim, '.$1').split('.');
  return qa.reduce((prev, next) => {
    if (!prev) return undefined;
    return prev[next];
  }, o);
}

function formatTweet(obj) {
  return {
    created_at: obj.created_at,
    id: obj.id,
    text: obj.text,
    username: _(obj, 'user.screen_name'),
    userDisplayName: _(obj, 'user.name'),
    avatar: _(obj, 'user.profile_image_url_https'),
    url: _(obj, 'entities.urls[0].url'),
    stringData: JSON.stringify(obj, null, 2),
  };
}

const searchTweets = async () => {
  const params = { q: 'reactjs' };
  const res = await client.get('/search/tweets.json', params);
  return res.statuses;
};

const searchAndSave = async () => {
  console.log('Searching tweets');
  console.log();

  const tweets = await searchTweets();
  const bulk = Tweet.collection.initializeOrderedBulkOp();

  tweets.map(function(tweet) {
    bulk.find({ id: tweet.id }).remove();
    bulk.insert(formatTweet(tweet));
  });

  bulk.execute();
};

setInterval(searchAndSave, parseInt(INTERVAL, 10));
