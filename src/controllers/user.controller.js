import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiError } from "../utils/ApiError.js";  
import {User} from '../models/user.models.js'; 
import {uploadFile} from '../utils/cloudinary.js'; 
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken=async(userId)=>{ // this method takes the userId, for which the function generate token for this user
  try{
    const user =await User.findById(userId); // here user is the object which is returned by DB
    const accessToken=user.generateAccessToken();
    const refreshToken=user.generateRefreshToken();

    //refresh token is stored in both user document and DB
    user.refreshToken=refreshToken;// store in user document
    await user.save({validateBeforeSave:false});  // store the updated user document in db 
    // validateBeforeSave:false: it used becoz, normally Mongoose runs schema validation before saving, this option skips that validation for this save operation, becoz to avoid running unrelated validations while updating the refresh token
    return {accessToken,refreshToken};

  }catch(error){
    throw new ApiError(500, "something went wrong while generating the refresh and acccess token");
  }
}



const registerUser=asyncHandler(async (req,res)=>{ // in asynchandler the fun is (async(req,res)=>{..}), it is simply run the async controller & handle its errors
  /*  this below is just for the sake of understanding ,written in 1st class for learning purpose
  //res.status(200).json({
   // message:"Hola"
  //})
  */

  //step 1:
  const {fullName,userName,email,password}=req.body  // we took the json data only, see the user.models.js for reference that what user data we get from frontend
  //console.log("email: ", email);
  //console.log("password : ", password);
  //console.log("req.body:", req.body);

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
 // console.log("validation passed");
  

  //step3:
  const existedUser= await User.findOne({  //here findOne() searches the db & returns the first matching document,if no document matches, it returns null
    $or: [{userName},{email}] // $or checks two condition :  does a user have this 1. username , 2. email, if either condition matche, findOne() returns the matching user
  })
  //console.log("existed user:", existedUser);
  if(existedUser){
    throw new ApiError(409, "User with email or password is alraedy exist");
  }

  ///step4: check for avatar & coverImage 
  //console.log("req.files:",req.files);
  const avatarLocalPath=req.files?.avatar[0]?.path;  //req.files: contains the files uploaded by user, it is usually populated by Multer middleware, 
  //the field name used for avatar file(which is define under (upload.fields[...]) in user.routes.js), 
  // [0] means gets the first file from the arrsy of uploaded avatar files, .path: gets the local path where multer temporarily stored the file
  // ?. this is optinal chaining
  const coverImageLocalPath=req.files?.coverImage?.[0]?.path;

  /*
  let coverImageLocalPath;
  //if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    coverImageLocalPath=req.files.coverImage[0].path
  }
  */

  

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required");
  }
  //console.log("avatar path:", avatarLocalPath, "cover Image:", coverImageLocalPath);
   
  //step5:
  const avatar=await uploadFile(avatarLocalPath);
  const coverImage=await uploadFile(coverImageLocalPath);

  if(!avatar){
    throw new ApiError(500, "Avatar upload failed");
  }
  //console.log("avatar url", avatar?.url, "coverImage url:", coverImage?.url );

  //step 6:create user object:
   const user= await User.create({
    fullName,
    userName: userName.toLowerCase(),
    email,
    password,
    avatar:avatar.url,
    coverImage:coverImage?.url || ""
  })
  //console.log("user:", user);

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

const loginUser=asyncHandler(async (req,res)=>{
   //step1: date from req:
   const {userName, email, password}=req.body;

   //step2:
   if(!(userName || email)){
    throw new ApiError(400, "userName or email is required");
   }
   //step 3:
   const user=await User.findOne({
    $or:[{userName}, {email}]
   })
   
   
   if(!user){
    throw new ApiError(404, " user does not exist");
   }

   //step4:
   const isPasswordValid=await user.isPasswordCorrect(password);

   if(!isPasswordValid){
    throw new ApiError(401, "invalid password");
   }

   //step 5:
   const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);

   //optional: step: to remove unwanted data to user:
   const loggedInUser=await User.findById(user._id).
   select("-password -refreshToken");

   //step6:
   //cookies can be modified by frontend as well, but we want to show only the cookies means to read the cookie, that's why we write httpOnly and secure to true so that only server can modify this
   //configure cookie option:
   const options={
    httpOnly:true,
    secure:true
   }
   //step 7:
    return res
    .status(200)
    .cookie("accessToken", accessToken,options) //this sets cookie name as accessToken, three argument , where 1st one tells cookie name, 2nd one tells value stored in cookie, 3rd one tells cookie settings
    .cookie("refreshToken", refreshToken,options)
    .json(
      new ApiResponse(
        200,{
          user:loggedInUser,accessToken,refreshToken  //we send user document ,accesstoken,refreshtoken to frontend in form of json
        },
        "User is looged in successfully" 
      )
    )
    //the above two cookie lines, where server wants intructs via response the browser to store two cookies ,where we do configure the cookie as well we store tokens in cookies
   




})

const logoutUser=asyncHandler(async (req,res)=>{
   await User.findByIdAndUpdate(
    req.user._id,{
      $set:{
        refreshToken: undefined
      }
    },
    {
      new:true // we return new updated user because refreshToken is undefined
    }
   )

   const options={
      httpOnly:true,
      secure:true
   }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})



export {registerUser,loginUser,logoutUser}