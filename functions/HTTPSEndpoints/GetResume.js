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
 * @param {HTTPSEndpointRequest} req
 * @param {HTTPSEndpointResponse} res
 * 
 * @example
 *  curl -vvvv -X GET "https://us-east-1.aws.data.mongodb-api.com/app/resumetracker-ksqcq/endpoint/resume?user=jdoe&co=ACME&jid=1234"
 *  curl -vvvv -X GET "https://us-east-1.aws.data.mongodb-api.com/app/resumetracker-ksqcq/endpoint/resume?user=jdoe&co=ACME"
 *  curl -vvvv -X GET "https://us-east-1.aws.data.mongodb-api.com/app/resumetracker-ksqcq/endpoint/resume?user=jdoe" 
 */
exports = async function(req, res) {
  let targetURL = 'https://github.com/jerrens'; // Default to profile page
  
  // Query params, e.g. '?user=Jerren&co=companyName&jid=1234' => {co: "companyName", user: "world", jid: "1234"}
  const user = req.query.user || 'JerrenSaunders';
  const company = req.query.co || 'Unknown';
  const jobID = req.query.jid || 'default';
  console.log(`Request from '${company}' to view ${user}'s profile for job ${jobID}`);
  
  // Load constant(s)
  const dbName = context.values.get('DBName');
  const redirectCollectionName = context.values.get('RedirectsColName');

  // Start building the document to record this request
  const linkActivityDoc = {
    req: context.request,
    ts: new Date(),
    action: {}
  };

  // Update activity for this company and also retrieve the redirect target URL for the requested resumeID
  const redirectCollection = context.services.get('mongodb-atlas').db(dbName).collection(redirectCollectionName);
  try {
    const redirectFilter = {
      user,
      company,
      jobID
    };
    
    const redirectDoc = await redirectCollection.findOneAndUpdate(
      redirectFilter,
      
      // Update Commands
      { 
        $inc: { 'activity.visits': 1 },
        $currentDate: { 'activity.lastAccessed': true },
        $setOnInsert: { 'activity.firstAccessed': new Date() }
      },
      
      // Options
      {
        upsert: true,
        returnNewDocument: true,
        
        // Minimize the response to only the details needed
        projection: {
          targetURL: true
        }
      }
    ).catch( (updateErr) => {
      console.log(`Error from findOneAndUpdate: ${updateErr.message}`);
    });
    
    
    // If targetURL was defined, then this was not an upsert and we know where to go
    if( redirectDoc.targetURL) {
      targetURL = redirectDoc.targetURL;
    }
    
    // If the targetURL wasn't defined (upserted or missing field), we need to retrieve it.
    else {
      linkActivityDoc.tags = ['first'];
      
      // Grab the default value for this company, or the default from the user profile
      console.log('The targetURL field was not found in the redirect document.  Retrieving from default...');
      
      const defaultTargetInfo = GetDefaultTarget(user, company);
      
      if( defaultTargetInfo && defaultTargetInfo.targetURL) {
        targetURL = defaultTargetInfo.targetURL;
        linkActivityDoc.tags.push('fromDefault');
        linkActivityDoc.source = defaultTargetInfo.source;
      }
      
      // If unable to determine a default, then return NotFound
      else {
        console.log('Unable to find a company default document for this user, nor the user profile document')
        res.setStatusCode(404);
        return;
      }
      
      // Update the redirect document so we only have this MISS once
      redirectCollection.updateOne( redirectFilter, { $set: { targetURL: targetURL } } ).catch( (setTargetURLErr) => console.log(`Failed to update the new Redirect document with the default targetURL: ${err.message}`)); // no need to await
    }
    
    // Note where the client was redirected
    linkActivityDoc.action.redirectedTo = targetURL;
  } catch (err) {
    console.log(`${err.message}`);
    linkActivityDoc.action.error = err;
  }
  
  // Record the activity
  context.services.get('mongodb-atlas').db(dbName).collection('LinkActivity').insertOne(linkActivityDoc); // no need to await
  
  // Build the redirect response
  res.setStatusCode(302);
  res.setHeader("Location", targetURL);
  res.setBody(""); // Return a response with no body
  return;
};


/**
 * Locates the default targetURL for the request from either the company default redirect record, or the user profile
 * 
 * @params {string} user - Username to locate the default for
 * @params {string} [company] - The company name to locate the default for
 */
async function GetDefaultTarget(user, company) {
  // Load constant(s)
  const dbName = context.values.get('DBName');
  const redirectCollectionName = context.values.get('RedirectsColName');
  const userProfilesCollectionName = context.values.get('UserProfilesColName');
  
  const responseProjection = {
    targetURL: true
  };
  
  // First, look for a default redirect for this company (if provided)
  if( company) {
    console.log(`Searching ${redirectCollectionName} for { user: ${user}, company: ${company} }`);
    const defaultCompanyDoc = await context.services.get('mongodb-atlas').db(dbName).collection(redirectCollectionName).findOne(
      {
        user: user,
        company: company,
        jobID: 'default'
      },
      { projection: responseProjection }
    );
    console.log(`defaultCompanyDoc: ${JSON.stringify(defaultCompanyDoc)}`);
    
    if( defaultCompanyDoc && defaultCompanyDoc.targetURL) {
      console.log('Found the target in the company default redirect document');
      return {
        ...defaultCompanyDoc,
        source: redirectCollectionName
      }
    }
  }
  
  // If not found, then retrieve the default from the user profile
  console.log(`Did not find ${user}'s company default record for '${company}' or it's targetURL field was not defined`);
  console.log(`Searching ${userProfilesCollectionName} for { user: ${user} }`);
  const userProfileDoc = await context.services.get('mongodb-atlas').db(dbName).collection(userProfilesCollectionName).findOne(
    {
      user: user
    },
    { projection: responseProjection }
  );
  console.log(`userProfileDoc: ${JSON.stringify(userProfileDoc)}`);
  
  if( userProfileDoc && userProfileDoc.targetURL) {
    console.log('Found the target in the user profile');
    return {
      ...userProfileDoc,
      source: userProfilesCollectionName
    }
  }
  
  // If here, then there was no company default entry, nor a user profile
  console.log(`Did not find ${user}'s profile or the targetURL field was not defined`);
}