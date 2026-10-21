import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";



//verifyJWT is a middleware, thet checks whether a user has a valid access token before allowing them to access a protected route
export const verifyJWT=asyncHandler(async(req,res,next)=>{
  try{
    //getting the accessToken:
    const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ",""); // this is to get token from the cookie method , if it is not available then try the Authorization header method
    // checking wheteher the token exists:
    if(!token){
      
      throw new ApiError(401, "Unauthorized request");
    }
    //console.log("token :", token);
    //verify the token: and decodedeToken is the payload returened after successful verification and contains key-valur pair in json form
    const decodedToken=jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); //jsonwebtoken package provides the verify() method, here it verifies that the token is verified with stored decode token secret in .env
    
    //finding the user in MongoDB:
    const user=await User.findById(decodedToken?._id).select("-password -refreshToken");

    //chceking whether the user exists:
    if(!user){
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user=user; // so,now onwards we created req.user , which is not automatically created by Express, we created this via our own made verifyJWT middleware and add this property
    //moving to the next middleware:
    next();
  }
  catch(error){
    throw new ApiError(401, error?.message || "Invalid access token")
  }
})