# Link Activity Document Schema

The `LinkActivity` collection holds historical documents for each individual request.

The documents in the collection currently have the following schema:

```json
{
    "_id": ObjectId, // Auto-generated
    "req": {
        // Contents of Mongo Atlas `context.request`
    },
    "ts": ISODate, // Time the request was made
    "action": {
        "redirectedTo": "string"  // The URL this client was given in the 302 response
    },

    // Optional Fields:
    "tags": [], // Array of strings to flag certain conditions encountered during this request
    "source": "string[Redirects|UserProfiles]" // The document where the targetURL was found
}
```

## Tags

The following tags may be found in the Link Activity document `tags` collection:

Tag         | Description
----------- | ------------------
first       | Set when a document did not contain a 'targetURL'.  Likely a result of the first request when the redirect document was upserted
fromDefault | Set when a default value was found from either the company default redirect document, or the user profile.  See `source` field for the origin
error       | Set if an exception was thrown.  The document will contains an `action.error` field with the error message
