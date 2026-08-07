import * as Minio from 'minio';

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000');
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || '';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || '';
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'puu-documents';

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

            // Set public policy for download if needed, or keep private
            // For now keep private and use presigned URLs or proxy
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
