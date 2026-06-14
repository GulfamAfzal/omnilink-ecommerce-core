const { MongoClient } = require('mongodb');


async function main() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db("OMS_Product_Catalog");
    
    const collections = await db.listCollections({ name: "Inventory" }).toArray();
    
    if (collections.length > 0 && collections[0].options && collections[0].options.validator) {
      console.log("Validator Schema:");
      console.log(JSON.stringify(collections[0].options.validator, null, 2));
    } else {
      console.log("No validator found for Inventory");
    }
  } finally {
    await client.close();
  }
}

main().catch(console.error);
