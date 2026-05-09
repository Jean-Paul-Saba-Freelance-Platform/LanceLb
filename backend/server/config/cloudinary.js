import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'

// Configure cloudinary with project credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})
console.log('Cloudinary configured for cloud:', process.env.CLOUDINARY_CLOUD_NAME)

// Storage for profile pictures — 400x400 crop fill
const profilePictureStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'lance/profile_pictures',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
})

// Storage for video intros
const videoIntroStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'lance/video_intros',
    allowed_formats: ['mp4', 'mov', 'webm'],
    resource_type: 'video',
  },
})

// Storage for CV/resume uploads — raw resource type for PDF files
const cvStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'lance/cvs',
    allowed_formats: ['pdf'],
    resource_type: 'raw',
  },
})

export const cvUpload = multer({ storage: cvStorage })
export const profilePictureUpload = multer({ storage: profilePictureStorage })
export const videoIntroUpload = multer({ storage: videoIntroStorage })
export { cloudinary }
