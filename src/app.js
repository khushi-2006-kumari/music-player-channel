import cors from "cors";
import cookieParser from "cookie-parser";

import express from 'express';
const app=express();


app.use(cors({
  origin:process.env.CORS_ORIGIN, 
  credentials:true  // allow cookie
}));

app.use(express.json({limit:"16kb"})) //Read JSON sent in the request body and puts it in req.body, and rejects bodies bigger than 16kb
app.use(express.urlencoded({extended:true,limit:"16kb"})) // Read data sent from HTML forms (e.g. name=khushi&age=20, i.e. URL-encoded ) into req.body
app.use(express.static("public")) // serve files from the public folder directly (images,PDFs,favicon, it usee when the user uploads a profile picture, express.static lets the browser show it from public folder)
app.use(cookieParser())

export {app} 

