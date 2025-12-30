import app from "./src/app"
import config from "./src/config"
import { fork } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

const server = app.listen(config.port, () => {
    console.log(`Server listening on ${config.port}`)
})

function initProcess() {
    return fork('./worker.ts', {
        env : {
            ...process.env
        },
        execArgv: ["--import", "tsx"],
    })
}

let childProcess = initProcess()

childProcess.on('error', (err) => {
    console.error('Child process error: ', err)
})

childProcess.on('exit', (code, signal) => {
    if (code === 0 || signal === 'SIGTERM' || signal === 'SIGINT') {
        console.log(`Worker exited cleanly for code : ${code} and signal : ${signal}`)
        return
    }
    console.error(`Worker crashed for code : ${code} and signal : ${signal}`)
    setTimeout(() => {
        childProcess = initProcess()
    }, 60000)
})

process.on('SIGINT', () => {
    server.close()
    childProcess.kill('SIGINT')
    setTimeout(() => {
        process.exit(0)
    }, 5000)
})

process.on('SIGTERM', () => {
    server.close()
    childProcess.kill('SIGTERM')
    setTimeout(() => {
        process.exit(0)
    }, 5000)
})