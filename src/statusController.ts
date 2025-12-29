import { Request, Response, NextFunction } from "express"
import z from 'zod'
import {prisma} from './prisma.main'

const idSchema = z.string()

const statusController = async (req : Request, res : Response, next : NextFunction) => {
    const parsed = idSchema.safeParse(req.params.id)
    
    console.log('Running')

    if (!parsed.success) {
        res.status(400).json({error : 'Bad request'})
    }
    
    const id = parsed.data

    try {
        const job = await prisma.documentJob.findUnique({where : {id}})

        if (!job) {
            return res.status(404).json({error : 'Job not found'})
        }

        const text = job.extractedText ? job.extractedText.replace(/(\r\n|\n|\r)/g, "") : ''


        return res.status(200).json({
            data  : {
                jobId : job?.id,
                status : job?.status,
                text
            }
        })

    }
    catch (err) {
        return res.status(500).json({error : 'Internal server error'})
    }
}

export default statusController