import app from "./src/app"
import config from "./src/config"
import { fork } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

app.listen(config.port, () => {
    console.log(`Server listening on ${config.port}`)
})

fork('./worker.ts', {
    env : {
        ...process.env
    },
    execArgv: ["--import", "tsx"],
})