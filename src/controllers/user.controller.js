import { asyncHandler } from "../utils/asyncHandler.js";



const registerUser=asyncHandler(async (req,res)=>{ // in asynchandler the fun is (async(req,res)=>{..}), it is simply run the async controller & handle its errors
   res.status(200).json({
    message:"Hola"
  })
})

export {registerUser}