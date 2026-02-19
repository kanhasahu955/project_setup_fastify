import ImageKit from "@imagekit/nodejs";
import { env } from "./env.config";

let imagekitInstance: ImageKit | null = null;

export function initializeImageKit(): ImageKit | null {
    if (imagekitInstance) {
        return imagekitInstance;
    }

    if (!env.IMAGEKIT_PRIVATE_KEY || !env.IMAGEKIT_URL_ENDPOINT || !env.IMAGEKIT_PUBLIC_KEY) {
        console.warn("ImageKit credentials not configured. Image upload features will be disabled.");
        return null;
    }

    try {
        imagekitInstance = new ImageKit({
            publicKey: env.IMAGEKIT_PUBLIC_KEY,
            privateKey: env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
        });

        console.log("ImageKit initialized successfully");
        return imagekitInstance;
    } catch (error) {
        console.error("Failed to initialize ImageKit:", error);
        return null;
    }
}

export function getImageKit(): ImageKit | null {
    return imagekitInstance;
}

export function getUrlEndpoint(): string {
    return env.IMAGEKIT_URL_ENDPOINT;
}

export function getPublicKey(): string {
    return env.IMAGEKIT_PUBLIC_KEY;
}
