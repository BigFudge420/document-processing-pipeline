import express from 'express'
import uploadController from './uploadController'
import statusController from './statusController'

const app = express()

app.post('/documents', uploadController)
app.get('/documents/:id', statusController)

export default app