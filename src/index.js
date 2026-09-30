//require('dotenv').config({path: './env'});
import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({path:"./.env"});

// in youtube these all below codes from line 7 to line 19  are not mentioned b/c for 2026 all systems to connect little bit change so that i have to write these all
import express from 'express';
const app=express();
//import app from "./app.js";

connectDB()
.then(()=>{
  app.listen(process.env.PORT|| 8000,()=>{
    console.log(`server running on port ${process.env.PORT || 8000}`);
  });
})
.catch((err)=>{
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
    throw error
   })

   app.listen(process.env.PORT,()=>{
    console.log(`App is listening on ${process.env.PORT}`);
   })
  }catch(error){
    console.log("Error: ",error);
    throw error
  }
})()
  */