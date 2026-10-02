//require('dotenv').config({path: './env'});
import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({path:"./.env"}); //path:"./.env tells that where is .env file
//dotenv.config(), reads your .env filr & puts its value into process.env, that's how process.env.PORT & process.env.MOGODB_URI get their values

// in youtube these all below codes from line 7 to line 19  are not mentioned b/c for 2026 all systems to connect little bit change so that i have to write these all
import express from 'express';
const app=express(); //app is server object
//import app from "./app.js";
const port=process.env.PORT || 8000;

connectDB() // connectDB() tries to connect to MongoDB, it's async, so it returns a promise
.then(()=>{ // runs only if the connectio succeeds, then app.listen  starts the server
  const server=app.listen(port,()=>{
    console.log(`server running on port ${port}`);
  });
  server.on("error",(error)=>{ // here we use event error listener
    console.log("Server error: " ,error);
    process.exit(1); // we can use here (throw error), as well
  });
})
.catch((err)=>{ // runs if the connection fails & prints the error
  console.log("MongoDB connection failed !!",err);
});











/*
import mongoose from 'mongoose';
import { DB_NAME } from './constants';
import express from 'express';
const app=express();

(async()=>{ // here we can write ;(async ()=>{...})() , we use semicolon for standard practice, suppose someone forget to use semicolon just above this line
  try{
   await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
   app.on("error",(error)=>{ 
    console.log("ERROR: ",error);
    throw error // it jumps to catch directly id there is an error 
   })

   app.listen(process.env.PORT,()=>{
    console.log(`App is listening on ${process.env.PORT}`);
   })
  }catch(error){
    console.log("Error: ",error);
    throw error // it is use here to re throw, and directly jump to catch but outer catch, but there is no outer catch, so it stops the code and whatever below after its code they will not run
    // if throw error not written then after catch, code still continue the next lines of code
    }
})()
*/