/**
 * Ensures that the index is created (and remains) on the Redirects collection that is used for redirect request.
 * 
 * This function should only be triggered when a new collection is created with the name "Redirects" or if a 'dropIndex' event occurs
 * on that collection.  
 */
exports = async function(changeEvent) {
  // Documentation on ChangeEvents: https://www.mongodb.com/docs/manual/reference/change-events

  // Access the _id of the changed document:
  // const docId = changeEvent.documentKey._id;

  // Get the MongoDB service you want to use (see "Linked Data Sources" tab)
  const serviceName = "mongodb-atlas";
  const databaseName = "ResumeTracker";
  const collection = context.services.get(serviceName).db(databaseName).collection(changeEvent.ns.coll);

  try {
    const indexName = 'QueryParamLookup'
  
    // Check if the index already exists
    const indexExists = await collection.indexExists(indexName);

    if (!indexExists) {
      // Create the index
      await collection.createIndex(
        {
          user : 1,
          company : 1,
          jobID : 1
        },
        { 
          name: indexName,
          unique : true
        }
      );

      console.log("Index created successfully.");
    } else {
      console.log("Index already exists!");
    }
  } catch(err) {
    console.error(`Problem while applying index to collection ${changeEvent.ns.coll}: ${err.message}`);
  }
};
