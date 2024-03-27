# User Profile Document Schema

The `UserProfiles` collection holds profile documents for users.  
The profile document currently has the following schema:

```json
{
    "_id": ObjectId, // Auto-generated
    "user": "string",

    // The default URL to redirect clients to if an target for the requested company and job ID could not be found
    "targetURL": "string", 


    // Optional:
    "name": "string",
    "email": "string"
}
```
