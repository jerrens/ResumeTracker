/**
 * @typedef HTTPSEndpointRequest
 * @property {object} query - Parsed Query parameters from the request
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
 */
exports = function({ query, headers, body}, response) {
    // Data can be extracted from the request as follows:

    // Query params, e.g. '?user=Jerren&co=companyName&rid=1234' => {co: "companyName", user: "world", rid: "1234"}
    const user = query.user || 'JerrenSaunders';
    const company = query.co || 'Unknown';
    const resumeID = query.rid || 'default';
    console.log(`Request from Company: ${company} to view ${user}'s resume: ${resumeID}`);

    // You can use 'context' to interact with other application features.
    // Accessing a value:
    // var x = context.values.get("value_name");

    // Querying a mongodb service:
    // const doc = context.services.get("mongodb-atlas").db("dbname").collection("coll_name").findOne();

    // Calling a function:
    // const result = context.functions.execute("function_name", arg1, arg2);

    // TODO: Update the counter for number of visits for this company and also retrieve the redirect target URL for the requested resumeID
    const doc = {
      redirectURL: 'https://github.com/jerrens/ResumeTracker'
    }
    
    response.setStatusCode(302);
    
    // Set the Location header to the redirect URL
    response.setHeader("Location", doc.redirectURL);
    
    // Return a response with no body
    response.setBody("");
    
    return;

    // The return value of the function is sent as the response back to the client
    // when the "Respond with Result" setting is set.
    // return  "Hello World!";
};

// Test Command(s):
// curl https://us-east-1.aws.data.mongodb-api.com/app/resumetracker-ksqcq/endpoint/resume?user=jdoe&co=ACME&rid=8795
// curl https://us-east-1.aws.data.mongodb-api.com/app/resumetracker-ksqcq/endpoint/resume?user=jdoe&co=ACME
// curl https://us-east-1.aws.data.mongodb-api.com/app/resumetracker-ksqcq/endpoint/resume?user=jdoe