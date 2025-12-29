import { Request, Response, NextFunction } from "express"
import multer, { MulterError } from 'multer'
import fileFilter from './fileFilter'
import { prisma } from './prisma.main'
import { Prisma } from "@prisma/client"
import fs from 'fs'

const uploadController = (req : Request, res : Response, next : NextFunction) => {
    const upload = multer({
        dest : 'temp/',
        limits : {
            fileSize : 10 * 1024**2
        },
        fileFilter
    }).single('document')

    upload(req, res, async (err) => {
        if (err) {
            if (err instanceof MulterError) {
                switch (err.code) {
                    case 'LIMIT_FILE_SIZE':
                        return res.status(413).json({error : 'Content too large'})

                    case 'LIMIT_UNEXPECTED_FILE':
                        return res.status(400).json({error : 'Unexpected field'})
                    
                    default: 
                        console.error('Multer error', err.code, err.message)
                }
            }
            else if (err.message === 'INVALID_FILE_TYPE') {
                return res.status(415).json({error : 'Unsupported media type'})
            }
            console.error('Internal server error', err.code, err.message)
            return res.status(500).json({error : 'Internal server error'})
        }

        if (!req.file) {
            return res.status(400).json({error : 'Document not provided'})
        }
        try {
            const createdJob = await prisma.documentJob.create({
                data : {
                    status : 'pending',
                    filePath : req.file?.path
                }
            })

            res.status(202).json({jobId : createdJob.id})
        } catch (error) {
            if (req.file.path) {
                await fs.promises.unlink(req.file.path)
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                console.error('Prisma error:', error.code, error.message)
            } else {
                console.error('Unexpected error:', error)
            }
            return res.status(500).json({error : 'Internal server error'})
        }
    })
}

export default uploadController