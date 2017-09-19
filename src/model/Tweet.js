import mongoose from 'mongoose';

const Schema = new mongoose.Schema(
  {
    created_at: {
      type: String,
      required: true,
    },
    id: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    username: {
      type: String,
    },
    userDisplayName: {
      type: String,
    },
    avatar: {
      type: String,
    },
    url: {
      type: String,
    },
    stringData: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
    collection: 'tweet',
  },
);

export default mongoose.model('Tweet', Schema);
