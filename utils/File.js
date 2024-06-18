const { MongoClient, ObjectId } = require('mongodb');
const dbClient = require('./db');

class File {
  static async findById(id) {
    const db = dbClient.db();
    return db.collection('files').findOne({ _id: new ObjectId(id) });
  }

  static async create(file) {
    const db = dbClient.db();
    const result = await db.collection('files').insertOne(file);
    return result;
  }
}

module.exports = File;
