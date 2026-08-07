import * as Minio from 'minio';
import config from '../config/index';

const MINIO_ENDPOINT = config.MINIO_ENDPOINT;
const MINIO_PORT = config.MINIO_PORT;
const MINIO_USE_SSL = config.MINIO_USE_SSL;
const MINIO_ACCESS_KEY = config.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = config.MINIO_SECRET_KEY;
const BUCKET_NAME = config.MINIO_BUCKET_NAME;

const minioClient = new Minio.Client({
    endPoint: MINIO_ENDPOINT,
    port: MINIO_PORT,
    useSSL: MINIO_USE_SSL,
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY
});

// Ensure bucket exists
async function ensureBucket() {
    try {
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME);
            console.log(`Bucket ${BUCKET_NAME} created.`);
        }
    } catch (err) {
        console.error('Error checking/creating bucket:', err);
    }
}

export const storage = {
    /**
     * Upload a file buffer to MinIO
     */
    uploadFile: async (filename: string, buffer: Buffer, contentType: string) => {
        try {
            await ensureBucket();
            await minioClient.putObject(BUCKET_NAME, filename, buffer, buffer.length, {
                'Content-Type': contentType
            });
            return `http://${MINIO_ENDPOINT}:${MINIO_PORT}/${BUCKET_NAME}/${filename}`;
        } catch (error) {
            console.error('MinIO upload error:', error);
            throw new Error('Failed to upload file to storage');
        }
    },

    /**
     * Get a file stream
     */
    getFileStream: async (filename: string) => {
        try {
            return await minioClient.getObject(BUCKET_NAME, filename);
        } catch (error) {
            console.error('MinIO get file error:', error);
            throw error;
        }
    },

    /**
     * Delete a file
     */
    deleteFile: async (filename: string) => {
        try {
            await minioClient.removeObject(BUCKET_NAME, filename);
        } catch (error) {
            console.error('MinIO delete error:', error);
            throw error;
        }
    }
};
