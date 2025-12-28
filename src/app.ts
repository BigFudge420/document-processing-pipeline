import express from 'express'
import uploadController from './uploadController'

const app = express()

app.post('/documents', uploadController)

export default app