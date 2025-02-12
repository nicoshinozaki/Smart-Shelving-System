const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;

async function hashExistingPasswords() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('smartshelving'); // Update with your DB name
    const usersCollection = db.collection('users');

    // Find all users with plain text passwords (Assuming they are not hashed)
    const users = await usersCollection.find({}).toArray();
    for (const user of users) {
      if (!user.password.startsWith('$2b$')) {  // Check if password is already hashed
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword } }
        );
        console.log(`Updated password for ${user.email}`);
      }
    }
    console.log('All passwords have been hashed.');
  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await client.close();
  }
}

hashExistingPasswords();
