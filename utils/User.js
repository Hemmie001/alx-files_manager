// utils/User.js

const { ObjectId } = require('mongodb');
const dbClient = require('./db');

class User {
  static async findById(userId) {
    return dbClient.getCollection('users').findOne({ _id: new ObjectId(userId) });
  }
}

module.exports = User;
