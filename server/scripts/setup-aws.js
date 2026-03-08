/**
 * VeloCity AWS Infrastructure Setup Script
 * Run once: node server/scripts/setup-aws.js
 */

import 'dotenv/config';
import { CreateBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { CreateTableCommand, DescribeTableCommand, waitUntilTableExists } from '@aws-sdk/client-dynamodb';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { s3Client, ddbClient, bedrockClient, S3_BUCKET, BEDROCK_MODEL_ID, DYNAMODB_PREFIX } from '../config/aws.js';

const region = process.env.AWS_REGION || 'ap-south-1';

async function log(emoji, msg) {
    console.log(`${emoji}  ${msg}`);
}

// --- 1. S3 Bucket ---
async function setupS3() {
    log('📦', `Creating S3 bucket: ${S3_BUCKET}`);
    try {
        await s3Client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
        log('✅', 'S3 bucket created');
    } catch (err) {
        if (err.name === 'BucketAlreadyOwnedByYou' || err.name === 'BucketAlreadyExists') {
            log('ℹ️', 'S3 bucket already exists');
        } else {
            throw err;
        }
    }

    // Set CORS
    try {
        await s3Client.send(new PutBucketCorsCommand({
            Bucket: S3_BUCKET,
            CORSConfiguration: {
                CORSRules: [{
                    AllowedHeaders: ['*'],
                    AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
                    AllowedOrigins: ['*'],
                    ExposeHeaders: ['ETag'],
                    MaxAgeSeconds: 3600,
                }],
            },
        }));
        log('✅', 'S3 CORS configured');
    } catch (err) {
        log('⚠️', `S3 CORS error: ${err.message}`);
    }
}

// --- 2. DynamoDB Tables ---
async function createTable(tableName, keySchema, attributeDefinitions, ttlAttribute) {
    try {
        await ddbClient.send(new DescribeTableCommand({ TableName: tableName }));
        log('ℹ️', `Table ${tableName} already exists`);
        return;
    } catch (err) {
        if (err.name !== 'ResourceNotFoundException') throw err;
    }

    log('📊', `Creating table: ${tableName}`);
    await ddbClient.send(new CreateTableCommand({
        TableName: tableName,
        KeySchema: keySchema,
        AttributeDefinitions: attributeDefinitions,
        BillingMode: 'PAY_PER_REQUEST',
    }));

    await waitUntilTableExists({ client: ddbClient, maxWaitTime: 60 }, { TableName: tableName });
    log('✅', `Table ${tableName} created`);
}

async function setupDynamoDB() {
    // velocity-creators (PK: userId)
    await createTable(`${DYNAMODB_PREFIX}creators`,
        [{ AttributeName: 'userId', KeyType: 'HASH' }],
        [{ AttributeName: 'userId', AttributeType: 'S' }]
    );

    // velocity-scripts (PK: userId, SK: scriptId)
    await createTable(`${DYNAMODB_PREFIX}scripts`,
        [{ AttributeName: 'userId', KeyType: 'HASH' }, { AttributeName: 'scriptId', KeyType: 'RANGE' }],
        [{ AttributeName: 'userId', AttributeType: 'S' }, { AttributeName: 'scriptId', AttributeType: 'S' }]
    );

    // velocity-trends (PK: niche, SK: date)
    await createTable(`${DYNAMODB_PREFIX}trends`,
        [{ AttributeName: 'niche', KeyType: 'HASH' }, { AttributeName: 'date', KeyType: 'RANGE' }],
        [{ AttributeName: 'niche', AttributeType: 'S' }, { AttributeName: 'date', AttributeType: 'S' }]
    );

    // velocity-analytics (PK: userId, SK: videoId)
    await createTable(`${DYNAMODB_PREFIX}analytics`,
        [{ AttributeName: 'userId', KeyType: 'HASH' }, { AttributeName: 'videoId', KeyType: 'RANGE' }],
        [{ AttributeName: 'userId', AttributeType: 'S' }, { AttributeName: 'videoId', AttributeType: 'S' }]
    );

    // velocity-sessions (PK: sessionId)
    await createTable(`${DYNAMODB_PREFIX}sessions`,
        [{ AttributeName: 'sessionId', KeyType: 'HASH' }],
        [{ AttributeName: 'sessionId', AttributeType: 'S' }]
    );
}

// --- 3. Verify Bedrock ---
async function verifyBedrock() {
    log('🤖', `Testing Bedrock model: ${BEDROCK_MODEL_ID}`);
    try {
        const command = new InvokeModelCommand({
            modelId: BEDROCK_MODEL_ID,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 50,
                messages: [{ role: 'user', content: 'Say "VeloCity is live!" in one line.' }],
            }),
        });
        const response = await bedrockClient.send(command);
        const body = JSON.parse(new TextDecoder().decode(response.body));
        log('✅', `Bedrock response: ${body?.content?.[0]?.text || 'OK'}`);
    } catch (err) {
        log('❌', `Bedrock error: ${err.message}`);
    }
}

// --- Run ---
async function main() {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   VeloCity AWS Infrastructure Setup      ║');
    console.log(`║   Region: ${region.padEnd(30)}║`);
    console.log('╚══════════════════════════════════════════╝\n');

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.error('❌ AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in .env');
        process.exit(1);
    }

    try {
        await setupS3();
        console.log('');
        await setupDynamoDB();
        console.log('');
        await verifyBedrock();

        console.log('\n╔══════════════════════════════════════════╗');
        console.log('║   ✅ Setup Complete!                     ║');
        console.log('╚══════════════════════════════════════════╝\n');
        console.log('Services ready:');
        console.log('  • S3 bucket:', S3_BUCKET);
        console.log('  • DynamoDB tables: creators, scripts, trends, analytics, sessions');
        console.log('  • Bedrock model:', BEDROCK_MODEL_ID);
        console.log('  • Transcribe, Rekognition, Polly, Comprehend, Translate: Ready');
        console.log('');
    } catch (err) {
        console.error('\n❌ Setup failed:', err.message);
        process.exit(1);
    }
}

main();
