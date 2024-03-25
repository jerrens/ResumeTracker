/**
 * @typedef HTTPSEndpointRequest
 * @property {object} query - Parsed Query parameters from the request URL
 * @property {object} headers - Headers set by the client on the request
 * @property {object} body - A BSON object representing the request body
 */

/**
 * HTTPS Endpoint Handler for GET /resume
 * Updates the visit count for the request (user + company) and then redirects to the target URL specified by the resumeID, or the default for the company
 * 
 * @route GET /resume
 * @group resume
 * @param {HTTPSEndpointRequest} request
 * @param {HTTPSEndpointResponse} response
 * 
 * @example
 *  curl -vvvv -X GET "https://us-east-1.aws.data.mongodb-api.com/app/resumetracker-ksqcq/endpoint/resume?user=jdoe&co=ACME&jid=1234"
 *  curl -vvvv -X GET "https://us-east-1.aws.data.mongodb-api.com/app/resumetracker-ksqcq/endpoint/resume?user=jdoe&co=ACME"
 *  curl -vvvv -X GET "https://us-east-1.aws.data.mongodb-api.com/app/resumetracker-ksqcq/endpoint/resume?user=jdoe" 
 */
exports = async function({ query, headers, body}, response) {
  let targetURL = 'https://github.com/jerrens'; // Default to profile page
  
  // Query params, e.g. '?user=Jerren&co=companyName&jid=1234' => {co: "companyName", user: "world", jid: "1234"}
  const user = query.user || 'JerrenSaunders';
  const company = query.co || 'Unknown';
  const jobID = query.jid || 'default';
  console.log(`Request from '${company}' to view ${user}'s profile for job ${jobID}`);

  // Load constants
  const dbName = context.values.get("DBName");

  // Querying a mongodb service:
  // const doc = context.services.get("mongodb-atlas").db("dbname").collection("coll_name").findOne();

  // Calling a function:
  // const result = context.functions.execute("function_name", arg1, arg2);
  
  const redirectCollection = context.services.get("mongodb-atlas").db(dbName).collection("Redirects");

  // Update activity for this company and also retrieve the redirect target URL for the requested resumeID
  try {
    try {
    const redirectDoc = await redirectCollection.findOneAndUpdate(
        // Filter
        {
          user,
          company,
          jobID
        },
        
        // Update Commands
        { 
          $inc: { visits: 1 },
          $currentDate: { lastAccessed: true },
          $setOnInsert: { firstAccessed: new Date() }
        },
        
        // Options
        {
          upsert: true,
          returnDocument: 'after'
        }
      );
    
      
    targetURL = redirectDoc.targetURL;
    } catch (updatErr) {
      console.log(`Error from findOneAndUpdate: ${updatErr}`);
    }
    
    // If the targetURL wasn't defined (upserted or missing field), we need to retrieve it
    // Grab the default value for this company, or the default from the user profile
    if( !targetURL) {
      console.log('The Redirect document was missing the targetURL field.  Updating...');
      
      // TODO: Update the document so we only have this MISS once
      targetURL = 'https://github.com/jerrens/ResumeTracker'; // HACK: Hard-coding for now
    }
  } catch (err) {
    console.log(`${err.message}`);
  }
  
  // Build the redirect response
  response.setStatusCode(302);
  response.setHeader("Location", targetURL);
  response.setBody(""); // Return a response with no body
  return;
};