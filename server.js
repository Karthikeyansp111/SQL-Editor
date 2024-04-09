const express = require('express');
const bodyParser = require('body-parser');
const { BigQuery } = require('@google-cloud/bigquery');
const snowflake = require('snowflake-sdk');
const path = require('path'); // Import the path module

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * TODO(developer):
 *  1. Uncomment and replace these variables before running the sample.
 *  2. Set up ADC as described in https://cloud.google.com/docs/authentication/external/set-up-adc
 *  3. Make sure you have the necessary permission to list storage buckets "storage.buckets.list"
 *    (https://cloud.google.com/storage/docs/access-control/iam-permissions#bucket_permissions)
 */

const projectId = 'my-project-1540739206483';

const {Storage} = require('@google-cloud/storage');

async function authenticateImplicitWithAdc() {
  const storage = new Storage({
    projectId,
  });
  const [buckets] = await storage.getBuckets();
  console.log('Buckets:');

  for (const bucket of buckets) {
    console.log(`- ${bucket.name}`);
  }

  console.log('Listed all storage buckets.');
}

authenticateImplicitWithAdc();

// Initialize BigQuery client
const bigquery = new BigQuery();

// Initialize Snowflake connection parameters
const snowflakeConfig = {
    account: 'BOKSXMT.SG62866',
    username: 'KARTHIKEYAN',
    password: 'Karthi@123',
    warehouse: 'COMPUTE_WH',
    database: 'STUDENT',
    schema: 'CLASS'
};

// Endpoint for executing SQL queries
app.post('/execute-query', async (req, res) => {
    const { query } = req.body;

    try {
        // Execute query on BigQuery
        const bigqueryResult = await executeQueryBigQuery(query);
        // Execute query on Snowflake
        const snowflakeResult = await executeQuerySnowflake(query);

        res.json({ bigqueryResult, snowflakeResult });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Function to execute SQL query on BigQuery
async function executeQueryBigQuery(query) {
    const options = {
        query: query,
        // Location must match the dataset(s) referenced in the query.
        location: 'US',
    };

    const [job] = await bigquery.createQueryJob(options);
    const [rows] = await job.getQueryResults();

    return rows;
}

// Function to execute SQL query on Snowflake
async function executeQuerySnowflake(query) {
    return new Promise((resolve, reject) => {
        const connection = snowflake.createConnection(snowflakeConfig);

        connection.connect(async (err, conn) => {
            if (err) {
                reject(err);
                return;
            }

            conn.execute({
                sqlText: query,
                complete: async (err, stmt, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(rows);
                }
            });
        });
    });
}

app.listen(port, () => {
    console.log('Server is listening at http://localhost:${port}');
});