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
      required: true,
    },
    userDisplayName: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    stringData: {
      type: String,
      required: true,
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
