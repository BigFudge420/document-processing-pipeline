import { DocumentJob } from '@prisma/client';
import Tesseract, { createWorker } from 'tesseract.js';
import config from './config';

interface TrackedWorker {
    id : number,
    worker : Tesseract.Worker,
    busy : boolean
}

const CONCURRENCY = config.concurrency

const slots : TrackedWorker[] = []

async function init() {
    for (let i = 0; i < CONCURRENCY; i++){
        const worker = await createWorker('eng')
        slots.push({id : i, worker, busy : false})
    }
}

async function acquireSlot() : Promise<TrackedWorker> {
    while(true) {
        const slot = slots.find(w => !w.busy)
        if (slot) {
            return slot
        }
        await new Promise(res => setTimeout(res, 100))
    }
}

async function runOCR(
    file : DocumentJob,
    timeoutMS : number = 300000
) : Promise<string> {
    const slot = await acquireSlot() 

    slot.busy = true 

    const timeout = setTimeout( async () => {
        await slot.worker.terminate()

        slot.worker = await createWorker('eng')
        slot.busy = false
    }, timeoutMS)

    try {
        const {data : {text}} =  await slot.worker.recognize(file.filePath)
        return text
    }
    finally {
        clearTimeout(timeout)
        slot.busy = false
    }
}

export default runOCR

init()