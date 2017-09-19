// @flow

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { isEmail } from 'validator';

const EmailSchema = {
  value: {
    type: String,
    index: true,
    validate: [str => isEmail(str), 'Invalid email address'],
    required: true,
    description: 'E-mail',
  },
  provider: {
    type: String,
    required: true,
  },
};

const Schema = new mongoose.Schema(
  {
    emails: {
      type: [EmailSchema],
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      index: true,
    },
    lastName: {
      type: String,
      required: true,
      index: true,
    },
    tokens: {
      type: mongoose.Schema.Types.Mixed,
    },
    socialProfiles: {
      type: mongoose.Schema.Types.Mixed,
    },
    password: {
      type: String,
      min: 6,
      max: 200,
    },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
    collection: 'user',
    autoIndex: false,
  },
);

Schema.pre('save', function(next) {
  // Hash the password
  if (this.isModified('password')) {
    this.password = this.encryptPassword(this.password);
  }

  return next();
});

Schema.methods = {
  authenticate(plainTextPassword) {
    return bcrypt.compareSync(plainTextPassword, this.password);
  },
  encryptPassword(password) {
    return bcrypt.hashSync(password, 8);
  },
};

export default mongoose.model('User', Schema);
