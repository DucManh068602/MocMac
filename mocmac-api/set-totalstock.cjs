const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mocmac';
(async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const result = await db.collection('products').updateMany(
    { totalStock: { $exists: false } },
    { $set: { totalStock: 100 } }
  );
  console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount);
  const count = await db.collection('products').countDocuments({ totalStock: { $exists: false } });
  console.log('Still missing totalStock:', count);
  await client.close();
})().catch(e => { console.error(e); process.exit(1); });
