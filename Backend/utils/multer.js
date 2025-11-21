import multer from 'multer';

// Configure multer for larger file sizes (50MB for videos)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'tmp/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop())
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for videos
  },
  fileFilter: function (req, file, cb) {
    // Allow images and videos
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedVideoTypes = /mp4|mov|avi|quicktime|x-msvideo/;
    const ext = file.originalname.split('.').pop().toLowerCase();
    const mimetype = file.mimetype;
    
    if (allowedImageTypes.test(ext) && mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    
    if (allowedVideoTypes.test(ext) && mimetype.startsWith('video/')) {
      return cb(null, true);
    }
    
    cb(new Error('Only image and video files are allowed!'));
  }
});

export default upload;
