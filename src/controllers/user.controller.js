import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiError } from "../utils/ApiError.js"; //for step1
import {User} from '../models/user.models.js'; //for step 3
import {uploadFile} from '../utils/cloudinary.js'; // for step 5
import { ApiResponse } from "../utils/ApiResponse.js";



const registerUser=asyncHandler(async (req,res)=>{ // in asynchandler the fun is (async(req,res)=>{..}), it is simply run the async controller & handle its errors
  /*  this below is just for the sake of understanding ,written in 1st class for learning purpose
  //res.status(200).json({
   // message:"Hola"
  //})
  */

  //step 1:
  const {fullName,userName,email,password}=req.body  // we took the json data only, see the user.models.js for reference that what user data we get from frontend
  console.log("email: ", email);
  console.log("password : ", password);

  //step2:
  /*
  //1st method to validate via if else statement:
  if(fullName===""){
    throw new ApiError(400, " fullName is required");
  }
  else if(userName===""){
    throw new ApiError(400,"userName is required");
  }
  else if(email===""){
    throw new ApiError(400,"email is required");
  }
  else if(password===""){
    throw new ApiError(400,"password is required");
  }
  */

  //2nd method using .some()
  if(
    [fullName,userName,email,password].some((field)=> 
       field?.trim()==="" // field is all elements inside array i.e. fullNmae,userName,password,email, .trim() is used toremove the first and last whitespaces
    )
  ){
    throw new ApiError(400,"All fields are required");
  }

  //step3:
  const existedUser=User.findOne({  //here findOne() searches the db & returns the first matching document,if no document matches, it returns null
    $or: [{userName},{email}] // $or checks two condition :  does a user have this 1. username , 2. email, if either condition matche, findOne() returns the matching user
  })
  if(existedUser){
    throw new ApiError(409, "User with email or password is alraedy exist");
  }

  ///step4: check for avatar & coverImage 
  const avatarLocalPath=req.files?.avatar[0]?.path;  //req.files: contains the files uploaded by user, it is usually populated by Multer middleware, 
  //the field name used for avatar file(which is define under (upload.fields[...]) in user.routes.js), 
  // [0] means gets the first file from the arrsy of uploaded avatar files, .path: gets the local path where multer temporarily stored the file
  // ?. this is optinal chaining
  const coverImageLocalPath=req.files?.coverImage[0]?.path;

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required");
  }
   
  //step5:
  const avatar=await uploadFile(avatarLocalPath);
  const coverImage=await uploadFile(coverImageLocalPath);

  if(!avatar){
    throw new ApiError(500, "Avatar upload failed");
  }

  //step 6:create user object:
   const user= await User.create({
    fullName,
    userName: userName.toLowerCase(),
    email,
    password,
    avatar:avatar.url,
    coverImage:coverImage?.url | ""
  })

  //step 7:
   const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
  )
  //findById() searches MongoDB for the document  with that ID
  //user._id is the unique ID of the user document that was created earlier, we can write user.id as well but ._id is the actual unique identifier field stored in MngoDB
  // await: wait for DB query to finish
  //"-password -refreshToken" this is the way to exclude those field which we don't want from returned document after stored in DB, becoz these two are sensitive fields

  //step 8:
  if(!createdUser){
    throw new ApiError(500, "Something went wrong while registerig the user");
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  )


})

export {registerUser}