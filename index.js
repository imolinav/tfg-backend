import express from 'express'
import { json, urlencoded } from 'body-parser'
const app = express()
const port = 3000

app.use(json())
app.use(
  urlencoded({
    extended: true,
  })
)