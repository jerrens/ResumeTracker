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
 *  curl -vvvv -X GET "https://us-east-1.aws.data.mongodb-api.com/app/resumetracker-ksqcq/endpoint/resume?user=jdoe&co=ACME&rid=1234"
 *  curl -vvvv -X GET "https://us-east-1.aws.data.mongodb-api.com/app/resumetracker-ksqcq/endpoint/resume?user=jdoe&co=ACME"
 *  curl -vvvv -X GET "https://us-east-1.aws.data.mongodb-api.com/app/resumetracker-ksqcq/endpoint/resume?user=jdoe" 
 */
exports = async function({ query, headers, body}, response) {
    // Data can be extracted from the request as follows:

    // Query params, e.g. '?user=Jerren&co=companyName&rid=1234' => {co: "companyName", user: "world", rid: "1234"}
    const user = query.user || 'JerrenSaunders';
    const company = query.co || 'Unknown';
    const jobID = query.jid || 'default';
    console.log(`Request from Company: ${company} to view ${user} for job ${jobID}`);

    // You can use 'context' to interact with other application features.
    // Accessing a value:
    // var x = context.values.get("value_name");
    const dbName = context.values.get("DBName");

    // Querying a mongodb service:
    // const doc = context.services.get("mongodb-atlas").db("dbname").collection("coll_name").findOne();

    // Calling a function:
    // const result = context.functions.execute("function_name", arg1, arg2);
    
    const redirectCollection = context.services.get("mongodb-atlas").db(dbName).collection("Redirects");

    // TODO: Update the counter for number of visits for this company and also retrieve the redirect target URL for the requested resumeID
    try {
    const redirectDoc = await redirectCollection.findOneAndUpdate(
        // Filter
        {
          user: user,
          company: company,
          jobID: jobID
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
      
    let targetURL = redirectDoc.targetURL;
    
    // If the targetURL wasn't defined, we need to retrieve it
    // Grab the default value for this company, or the default from the user profile
    if( !targetURL) {
      console.log('The Redirect document was missing the targetURL field.  Updating...');
      targetURL = 'https://github.com/jerrens/ResumeTracker'; // HACK: Hard-coding for now
      
      // TODO: Update the document so we only have this MISS once (no need to await this update)
    }
    
    
    // Build the redirect response
    response.setStatusCode(302);
    response.setHeader("Location", targetURL);
    response.setBody(""); // Return a response with no body
    } catch (err) {
      console.error(`${err.message}; ${err.stack}`);
    }
    
    return;
};