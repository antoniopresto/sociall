import Tweet from '../type/TweetType';
import {connectionDefinitions} from 'graphql-relay';

export default connectionDefinitions({name: 'Tweet', nodeType: Tweet})
