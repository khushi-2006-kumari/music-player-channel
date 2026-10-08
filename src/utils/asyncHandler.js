//here we write asyncHandler function as a wrapper wherer we take an actual controller function we want to execute
//there are two methods by which we can write asynchandler function:

// using  promise:
const asyncHandler=(fun)=>{
   return (req,res,next)=>{
    Promise.resolve(fun(req,res,next)) // it uses promise instead of async-await
    .catch((error)=> next(error)) // it uses .catch instead of try-catch, it catches the error then 'next(error)' this passes the error to Express's error - handling middleware, and in middleware the status code and json response will be written
   }
}
export {asyncHandler}





/*
// using try- catch:
const asyncHandler=(fun)=> async(req,res,next)=>{ // asyncHandler takes a fun (function ) as an argument and then run async await
  try{
    await fun(req,res,next);  // here fun argument will run by taking arguments (req,res,next) and await for complete the function fun, that what it will return
  } 
  catch(error){ // if there is an error after running fun then this catch will execute, i.e. catch that error & call it error
    res.status(error.code || 404).json({ // 'res.status' : sets HTTP status code, 'error.code || 404' use error.code if it exists, otherwise 404, '.json' after setting the status code , ther server sends a JSON response for frontend
      success:false,
      message:error.message
    })
    //basically, send an error response to client with an appropriate status code & error msg
  }
}
*/
//next: Used to pass control to the next middleware or error-handling middleware