import { Request } from "express"
import path from 'path'

type MulterFile = Express.Multer.File

const fileFilter = (req : Request, file : MulterFile, cb : Function) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg']
    const allowedExt = ['.png', '.jpg', '.jpeg']

    const ext = path.extname(file.originalname).toLowerCase()

    if (allowedMimeTypes.includes(file.mimetype) && allowedExt.includes(ext)) {
        cb(null, true)
    }
    else {
        cb( new Error('INVALID_FILE_TYPE'), false )
    }
}

export default fileFilter