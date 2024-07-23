// require('dotenv').config({path:'./env'})
import connectDB from "./db/index.js";
import dotenv from "dotenv"
import { createServer } from 'node:http';
import { app } from "./app.js";
import { Server } from "socket.io";
import http from "http";

dotenv.config({
    path: './.env'
})


const httpServer = createServer();

let io;

connectDB()
    .then(() => {
        let server;
        server = app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT || 8000}`)
        })
        io = new Server(server, {
            // pingTimeout: 6000,
            transports:['websocket', 'polling'],
            serveClient: false,
            cors: {
                origin: process.env.CORS_ORIGIN
            }
        })
        io.on('connection', (socket) => {
            console.log('a user connected');
            socket.on('disconnect', () => {
                console.log('user disconnected');
            });
        });

    })
    .catch((err) => {
        console.log("Mongo DB connection failed !!", err);
    })

export { io };