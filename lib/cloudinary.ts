import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

// ---------------------------------------------------------------------------
// Singleton configuration
// Cloudinary's v2.config() is called once when this module is first imported.
// Subsequent imports reuse the same configured instance (Node module cache).
// ---------------------------------------------------------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // always return https URLs
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Subset of Cloudinary's UploadApiResponse containing the fields relevant
 * to this application (image display, storage references, metadata).
 */
export type CloudinaryUploadResult = Pick<
  UploadApiResponse,
  | 'url'
  | 'secure_url'
  | 'public_id'
  | 'resource_type'
  | 'format'
  | 'width'
  | 'height'
  | 'bytes'
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * uploadToCloudinary
 *
 * Uploads a file (Buffer or data-URI string) to Cloudinary and returns the
 * full upload result object.
 *
 * Configured folders used by this project:
 *  - `ln-hostel/gallery`  — gallery images
 *  - `ln-hostel/heroes`   — hero / banner images
 *
 * Automatic transforms applied at delivery time (not at upload):
 *  - `w_auto`  — responsive width
 *  - `f_auto`  — best format for the requesting browser
 *  - `q_auto`  — optimal quality compression
 *
 * Errors propagate to the caller — no swallowing.
 *
 * @param file   A Buffer containing the raw file bytes, or a data-URI string
 *               (e.g. `data:image/jpeg;base64,...`).
 * @param folder Target Cloudinary folder (e.g. `"ln-hostel/gallery"`).
 * @returns      The full UploadApiResponse from Cloudinary.
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  folder: string
): Promise<UploadApiResponse> {
  // Cloudinary's upload_stream (used for Buffers) and upload (used for
  // data-URIs / remote URLs) have slightly different call signatures,
  // so we wrap both in a single Promise for a consistent interface.
  if (Buffer.isBuffer(file)) {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            // result is guaranteed to be defined when error is undefined
            resolve(result as UploadApiResponse);
          }
        }
      );
      stream.end(file);
    });
  }

  // For data-URI strings (and remote URLs) use the promise-based upload()
  return cloudinary.uploader.upload(file, {
    folder,
    resource_type: 'auto',
  });
}
