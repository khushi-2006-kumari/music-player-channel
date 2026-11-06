import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";  
import {User} from '../models/user.models.js'; 
import {uploadFile,deleteFile} from '../utils/cloudinary.js'; 
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

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
    avatarPublicId:avatar.public_id,
    coverImage:coverImage?.url || "",
    coverImagePublicId: coverImage?.public_id || ""
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

// refreshAccessToken= controller: to refresh expired access tokens without requiring the user to log in again
const refreshAccessToken=asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request");

  }

  try{
     const decodedeToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
   
     const user=await User.findById(decodedeToken?._id);
   
     if(!user){
       throw new ApiError(401, "Invalid refresh token");
     }
   
     if(incomingRefreshToken!==user?.refreshToken){
       throw new ApiError(401, "Refresh token is expired or used");
     }
   
     const options={
       httpOnly:true,
       secure:true
     }
   
     const {accessToken,newRefreshToken}= await generateAccessAndRefreshToken(user._id);
   
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("newRefreshToken", newRefreshToken, options)
     .json(
       new ApiResponse(200,{accessToken, refreshToken:newRefreshToken},"Access token refreshed")
     )
  }
  catch(error){
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
})

const updateCurrentPassword=asyncHandler(async(req,res)=>{
   const {oldPassword,newPassword} =req.body;

    const user=await User.findById(req.user?._id);
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
      throw new ApiError(400, "Invalid password");

    }

    user.password=newPassword; //here newPassword changes the user documnet in memory, not permanent save in  database

    await user.save({validateBeforeSave:false}); //here we save the newPassword using built-in save operation , function in mongoose
    //  validateBeforeSave:false, here we set false becoz  mongoose runs schema validations before saving, and it runs email,username etc which we don't want now, so we skip it

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password updated successfully"));

})

const getCurrentUser=asyncHandler(async(req,res)=>{
   

    return res
    .status(200)
    .json( new ApiResponse(200,req.user,"current user fetched successfully"));
});

const updateAccountDetails=asyncHandler(async(req,res)=>{
      const {fullName, email, userName}=req.body;

      if(!fullName || !email || !userName){
        throw new ApiError(400, "All fields are required");
      }

      const user=await User.findByIdAndUpdate(
        req.user?._id,{
          $set:{ //update the specified fields,(fullName,email,userName) and other fields remain unchanged
            fullName,
            email,
            userName
          }
        },
        {new:true} //returns the updated user document instead of the old document
      ).select("-password"); //exclude the password field from returned user document for security

      return res
      .status(200)
      .json(new ApiResponse(200,user,"Account details updated successfully"));
});

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path;
    if(!avatarLocalPath){
      throw new ApiError(400,"Avatar file is missing");
    }

    const existingUser=await User.findById(req.user?._id);
    if(!existingUser){
      throw new ApiError(404, "User doesn't exist");
    }
    const oldPublicId=existingUser.avatarPublicId;

    const avatar=await uploadFile(avatarLocalPath);
    if(!avatar.url){
      throw new ApiError(400, "Error while uploading an avatar");
    }

    const user=await User.findByIdAndUpdate(
      req.user?._id,{
        $set:{
          avatar:avatar.url,
          avatarPublicId:avatar.public_id
        }
      },
      {new:true}
    ).select("-password");

    await deleteFile(oldPublicId);

    return res
    .status(200)
    .json(new ApiResponse(
      200,
      user,
      "Avatar updated successfully"
    ))
});

const  updateUserCoverImage=asyncHandler(async(req,res)=>{
  const coverImageLocalPath=req.file?.path;

  if(!coverImageLocalPath){
      throw new ApiError(400,"CoverImage file is missing");
  }

  const existingUser=await User.findById(req.user?._id);
    if(!existingUser){
      throw new ApiError(404, "User doesn't exist");
    }
  const oldPublicId=existingUser.coverImagePublicId;
  const coverImage=await uploadFile(coverImageLocalPath);
  if(!coverImage.url){
    throw new ApiError(400, "Error while uploading coverImage");
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,{
      $set:{
        coverImage:coverImage.url,
        coverImagePublicId:coverImage.public_id
      }
    },
    {new:true}
  ).select("-password");

  await deleteFile(oldPublicId)

  return res
  .status(200)
  .json(new ApiResponse(200, user, "CoverImage updated successfully"));
});

//fetch a user's YouTube-like channel profile along with subscription information
const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params; //get username from url

    if(!username?.trim){
      throw new ApiError(400, "Username is missing" );
    }
 //start aggregation pipeline on user collection,each stages process documents & passes its output to next stage:
 //like 1st stage is match to username ,the 2nd stage is lookup based on username to get this, then etc
    const channel=await User.aggregate([
         {
          //stage 1: find the user whose username matches the requested username
          $match:{
            username:username?.toLowerCase()
          }
         },
         //stage 2:
         {
          //1st lookup: find all the people who have subscribed to this channel
          $lookup:{
            from:"subscriptions", // db collections which we want to connect, in db Subscription is model but in db it coverts into subscriptions
            localField:"_id", //field from the current collection (User), _id
            foreignField:"channel", // field from the other collection (subscriptions), here channel, 
            as: "subscribers" // name of the new array in which matching documents are stored
          }
          //searches: channel===Khushi._id
         },
         {
          //2nd lookup: find all the channels that this user has subscribed to
          $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"
          }
          //Khushi._id===subscriber
         },
         //stage 3:
         {
          $addFields:{
            subscriberCount:{
              $size:"subscribers" //count the nnumber of elements in an array created in 1st lookup , basically gives number of subscriber
            },
            channelsSubscribedToCount:{
              $size:"subscribedTo" //count how many channel a user(Khushi) has subscribed to
            },
            
            // it checks whether the currently logged-in user has subscribed to channel being viwed
            isSubscribed:{
              $cond:{
                if:{
                  $in:[req.user?._id,"$subscribers.subscriber"] // $in: checks whether the first value exists in the 2nd array
                },
                then:true,
                else: false
              }
            }
            
            

          }
         }, 
         // stage 4: Select which fields we want in our final output
         {
          $project:{
            fullName:1,
            username: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1
          }
         }

    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully") // 'channel[0]':becoz aggregation returns an array but we are expecting only one user's profile
    )
});

const getWatchHistory= asyncHandler(async(req,res)=>{
   const user=await User.aggregate([
     {
      $match:{
        _id:new mongoose.Types.ObjectId(req.user._id)
      }
     },
     {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistories",
        pipleline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    userName:1,
                    fullName:1,
                    avatar:1
                    
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
     }

   ])

   return res
   .status(200)
   .json(
    new ApiResponse(200,user[0].watchHistory,"watch History fetched successfully")
   )
})


export {registerUser,loginUser,logoutUser,refreshAccessToken,updateCurrentPassword,
  getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getWatchHistory,getUserChannelProfile}