import { createWorker, createScheduler } from 'tesseract.js';
import type { DocumentJob } from '@prisma/client';
import { createPrisma } from "./src/db/createPrisma";
import 'dotenv/config'
import fs from 'fs'
import { PrismaClient } from '@prisma/client/extension';

const CONCURRENCY = 3

const scheduler = createScheduler()

let prisma : PrismaClient
async function init () {
    prisma = createPrisma()

    for (let i = 0; i < CONCURRENCY; i++){
        const worker = await createWorker('eng')
        scheduler.addWorker(worker)
    }

    workerLoop()
}

async function workerLoop() {
    while (true) {    
        try {
            const jobs = await pollOnce()
    
            if (jobs.length === 0) {
                await sleep(30000)
                continue
            }
        
            await startProcess(jobs)
        }        
            catch (err) {
            console.error('Worker loop error', err)
            await sleep(30000)
        }
    }
}

function sleep (ms : number) {
    return new Promise<void>(res => setTimeout(res, ms))
}

async function pollOnce() : Promise<DocumentJob[]> {
    const files = await prisma.documentJob.findMany({
        where : {
            OR : [
                {status : 'failed'},
                {status : 'pending'}
            ],
            attempts : {lt : 3}
        },
        take : CONCURRENCY
    })

    const tasks = files.map(async (file : DocumentJob) => {
        try {
            const claim = await prisma.documentJob.updateMany({
                where : {
                    OR : [
                        {status : 'pending'},
                        {status : 'failed'}
                    ],
                    id : file.id,
                    attempts : {lt : 3}
                },
                data : {
                    status : 'processing',
                    attempts : {increment : 1},
                    startedAt : new Date()
                }
            })
            return claim.count > 0 ? file : null 
        } catch (error) {
            console.error('Failed to claim job:', error)
            return null
        }
    })

    const claimed = (await Promise.all(tasks)).filter((f) : f is DocumentJob => f !== null)
    
    return claimed
}

async function startProcess(files : DocumentJob []) {
    const tasks = files.map(async (file) => {
        try {
            const { data : { text }} = await scheduler.addJob('recognize', file.filePath)
                
            await prisma.documentJob.update({
                where : {
                    id : file.id
                },
                data : {
                    status : 'completed',
                    extractedText : text,
                    completedAt : new Date()
                }
            })
            
            try {
                await fs.promises.unlink(file.filePath)   
            }
            catch (err) {
                console.error('Cleanup error', err)
            }
        }
        catch(err){
            console.error(`Error on file ${file.id}:`, err)
            
            let msg
            if (err instanceof Error) {
                msg = err.message
            }
            else {
                msg = 'Unknown error'
            }
            await prisma.documentJob.update({
                where : {
                    id : file.id
                },
                data : {
                    status : 'failed',
                    error: msg
                }
            })
        }
    })

    await Promise.all(tasks)
}

init()

