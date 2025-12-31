import dotenv from 'dotenv'

dotenv.config()

interface Config {
    port : number,
    databaseURL : string,
    concurrency : number,
    timeoutMS : number
}

const config : Config = {
    port : Number(process.env.PORT) || 3000,
    databaseURL : process.env.DATABASE_URL || (() => {
        throw new Error('No database url mentioned')
    })(),
    concurrency : Number(process.env.CONCURRENCY) || 3,
    timeoutMS : Number(process.env.TIMEOUT_MS) || 300000
} 

export default config
