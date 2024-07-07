import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { Server } from "socket.io"
const app = express()



app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

// these are the 4 basic setting that we need to get the data
app.use(express.json({
    limit:"16kb"
}))

app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}))

app.use(express.static("public"))

app.use(cookieParser())

// routes import

import userRouter from './routes/user.routes.js'

// routes declaration 

app.use("/api/v1/users",userRouter)
// /api/v1/users/register

export {app}