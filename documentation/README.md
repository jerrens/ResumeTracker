# Documentation

## Collections

There are currently three collections used in this service:

- [UserProfiles](#userprofiles)
- [Redirects](#redirects)
- [LinkActivity](#linkactivity)

----

### UserProfiles

This collection holds the documents to define a user.  Currently there is only one user within this application, but I wanted to make sure it was designed in a way that could be shared with my colleagues who were also affected by the site shutdown and others who are also in the job market.

This user document is also where a default `targetURL` can be defined and used when a specific document does not exists for a company in the Redirects collection.

To view the schema for documents in this collection, see [/schema/userProfileDoc.md](./schema/userProfileDoc.md)

#### UserProfiles Index

No index has been applied to this collection yet.

----

### Redirects

This collection contains documents for each user + company + job ID.  Each document is updated with details about the number of visits, as well as the first and last visit times.  Documents are automatically created (upserted) if not found and it's `targetURL` field will be initialized to the `targetURL` value currently set in the user + company default document (`jobID = 'default'`) if it exists, or the `targetURL` value currently set in the UserProfile document.

If it is desired that a specific job ID for a company be redirected to a different landing page than another job ID, then each document can be updated with a unique targetURL.

To view the schema for documents in this collection, see [/schema/redirectDoc.md](./schema/redirectDoc.md)

#### Redirects Index

An index with the following fields was added to this collection, containing the fields that are used as the primary filter to locate the appropriate redirect document.

```json
{
    "user" : 1,
    "company" : 1,
    "jobID" : 1
}

// The following option(s) were set on the index:
//   unique:true
```

----

### LinkActivity

This collection holds individual documents for each web request received on the `GET /resume` HTTPS Endpoint. These entries can be viewed to determine which companies and positions drew interest by the reader.

To view the schema for documents in this collection, see [/schema/linkActivityDoc.md](./schema/linkActivityDoc.md).

#### LinkActivity Index

No indexes have been applied to this collection yet.

As the system grows, indexing the `params.user` field would be beneficial since most queries would likely be written to limit data to the requesting user's entries.

Also, it will be beneficial for this to be a Time Series collection to improve future query times.

----

## HTTPS Endpoints

### GET /resume

This endpoint is the target of the short.io link that request are redirected to.  The controller function handling this request uses query parameters to locate the correct targetURL for this request and then responds with a 302 Redirect Location for the client to follow.
