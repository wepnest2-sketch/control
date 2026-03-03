import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Request, Response } from 'express';

// Cloudinary Configuration
cloudinary.config({
    cloud_name: 'dlwuxgvse',
    api_key: '589557557863559',
    api_secret: '-qknr_5WoXpjEBGCLaN74UrgufQ'
});

// Setup multer (memory storage is best for serverless)
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const config = {
    api: {
        bodyParser: false, // Required for multer
    },
};

// Helper to run middleware
function runMiddleware(req: any, res: any, fn: any) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result: any) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Run multer middleware
        await runMiddleware(req, res, upload.single('file'));

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'papillon_products',
        });

        res.status(200).json({ url: result.secure_url });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
}
