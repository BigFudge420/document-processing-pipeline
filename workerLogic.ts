import type { DocumentJob } from '@prisma/client';
import { createPrisma } from "./src/db/createPrisma";
import fs from 'fs'
import { PrismaClient } from '@prisma/client';
import runOCR from './src/runOCR';
import config from './src/config';

const CONCURRENCY = config.concurrency
const TIMEOUT_MS = config.timeoutMS

let prisma : PrismaClient
async function init () {
    prisma = createPrisma()

    process.on('SIGTERM', async () => {
        try {
            await prisma.$disconnect()    
    
        } catch (err) {
            console.error('Cleanup error: ', err)
        }
        finally {
            process.exit(0)
        }
    })
    
    process.on('SIGINT', async () => {
        try {
            await prisma.$disconnect()    
    
        } catch (err) {
            console.error('Cleanup error: ', err)
        }
        finally {
            process.exit(0)
        }
    })

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
        const fiveMinsAgo = new Date( Date.now() - TIMEOUT_MS)

        try {
            const claim = await prisma.documentJob.updateMany({
                where : {
                    OR : [
                        {status : 'pending'},
                        {status : 'failed'},
                        {
                            status : 'processing',
                            startedAt : { lt : fiveMinsAgo}
                        }
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
            const text = await runOCR(file, TIMEOUT_MS)
                
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

