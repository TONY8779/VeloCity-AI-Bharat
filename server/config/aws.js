import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { S3Client } from '@aws-sdk/client-s3';
import { TranscribeClient } from '@aws-sdk/client-transcribe';
import { RekognitionClient } from '@aws-sdk/client-rekognition';
import { PollyClient } from '@aws-sdk/client-polly';
import { ComprehendClient } from '@aws-sdk/client-comprehend';
import { TranslateClient } from '@aws-sdk/client-translate';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const awsConfig = {
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
};

// --- Service Clients ---

// Bedrock uses us-east-1 for cross-region inference profiles (us.anthropic.*)
const bedrockConfig = {
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
};
export const bedrockClient = new BedrockRuntimeClient(bedrockConfig);

export const s3Client = new S3Client(awsConfig);

export const transcribeClient = new TranscribeClient(awsConfig);

export const rekognitionClient = new RekognitionClient(awsConfig);

export const pollyClient = new PollyClient(awsConfig);

export const comprehendClient = new ComprehendClient(awsConfig);

export const translateClient = new TranslateClient(awsConfig);

const ddbClient = new DynamoDBClient(awsConfig);
export const dynamoDb = DynamoDBDocumentClient.from(ddbClient, {
    marshallOptions: { removeUndefinedValues: true },
});
export { ddbClient };

// --- Constants ---

export const S3_BUCKET = process.env.S3_BUCKET_NAME || 'velocity-creator-assets';
export const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || '';
export const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
export const DYNAMODB_PREFIX = process.env.DYNAMODB_TABLE_PREFIX || 'velocity-';
