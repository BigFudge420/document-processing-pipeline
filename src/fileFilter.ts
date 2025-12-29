import { Request } from "express"
import path from 'path'
import z from 'zod'

type MulterFile = Express.Multer.File

const fileSchema = z.object({
    mimetype : z.enum([
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "image/tiff",
        "image/bmp",
        "image/x-portable-anymap"
    ]),
    orginalname : z.string().min(1)
})

const allowedExtensions = [
        '.png',
        '.jpg',
        '.jpeg',
        '.jpe',
        '.tif',
        '.tiff',
        '.gif',
        '.bmp',
        '.webp',
        '.pbm',
        '.pgm',
        '.ppm',
        '.pnm'
    ] as const

const filenameSchema = z.string().refine((filename) => {
    const ext = path.extname(filename).toLowerCase()
    return allowedExtensions.includes(ext as any)
})

const fileFilter = (_req : Request, file : MulterFile, cb : Function) => {

    if (fileSchema.safeParse(file).success && filenameSchema.safeParse(file.originalname).success) {
        cb(null, true)
    }
    else {
        cb( new Error('INVALID_FILE_TYPE'), false )
    }
}

export default fileFilter