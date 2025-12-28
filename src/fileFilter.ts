import { Request, Express } from "express"
import path from 'path'

type MulterFile = Express.Multer.File

const fileFilter = (_req : Request, file : MulterFile, cb : Function) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'application/pdf']
    const allowedExt = ['.png', '.jpg', '.jpeg', '.pdf']

    const ext = path.extname(file.originalname).toLowerCase()

    if (allowedMimeTypes.includes(file.mimetype) && allowedExt.includes(ext)) {
        cb(null, true)
    }
    else if (file.size === 0) {
        cb(new Error('EMPTY_FILE'), false)
    }
    else {
        cb( new Error('INVALID_FILE_TYPE'), false )
    }
}

export default fileFilter