/**
 * This script will group the historical entries for a user and company.
 * The most active company will be listed first
 */

const user = 'JerrenSaunders';
// const company = '';
const MAX_HISTORY_SIZE = 1000;


db.getCollection("LinkActivity").aggregate([
    // { $limit: 10}, // For debugging

    // Split the query params up first so that the order of the params doesn't matter
    // and we can have better options when grouping
    {
        $addFields: {
            queryParamsObject: {
                $arrayToObject: {
                    $map: {
                        input: { $split: ["$req.rawQueryString", "&"] }, // Separate query params first on '&'
                        as: "keyValue",
                        in: { $split: ["$$keyValue", "="] } // Split each key-value pair
                    }
                }
            }
        }
    },

    {
        $match: {
            'queryParamsObject.user': user
            // 'queryParamsObject.co': company
        }
    },

    // We want to see the newest request first after grouping, so sort now
    { $sort: { ts: -1 } },


    // Group the query params that were used most
    {
        $group: {
            _id: {
                user: '$queryParamsObject.user',
                co: '$queryParamsObject.co'
            },
            history: {
                $push: {
                    url: { $concat: ['$req.httpMethod', ' ', { $ifNull: ['$req.httpReferrer', 'Unknown'] }, '?', { $ifNull: ['$req.rawQueryString', ''] }] },
                    ts: '$ts',
                    redirectedTo: '$action.redirectedTo'
                }
            }
        }
    },

    // Show the most frequently visited at the top & limit the history
    {
        $addFields: {
            historyCount: { $size: '$history' }, // So we can sort
            history: { $slice: ['$history', MAX_HISTORY_SIZE] } // Limit the history to avoid the individual documents from getting too large (`historyCount` will still contain the original size)
        }
    },
    { $sort: { historyCount: -1 } }
])