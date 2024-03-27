# Redirect Document Schema

The `Redirects` collection holds the individual redirection details for a user, company, and optional job ID.

It is recommended that a document be created for each user + company, with a jobID value of `default`.  If a request comes in for a user + company and a document with the specified `jid` cannot be found, then an attempt to lookup the `targetURL` from the sibling document with `jobID: 'default'` will be tried first.  If a user + company default redirect document is not present, the client will be redirected to the `targetURL` path defined in the specified [user's profile](userProfileDoc.md).

The redirect document currently has the following schema:

```json
{
    "_id": ObjectId, // Auto-generated
    "user": "string",
    "company": "string",
    "jobID": "string", // Either 'default' or the application reference this link refers to (`jid` query param value)
    "targetURL": "string", // The page the client should be redirected to

    // Internal fields
    "activity": {
        "firstAccessed": ISODate,
        "lastAccessed": ISODate,
        "visits": number
    }
}
```
