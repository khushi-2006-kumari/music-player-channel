class ApiError extends Error{ // we are creating own class  called ApiError, and Error is built-in error class in JS
  constructor(
    statusCode, // HTTP status code of error
    message="Something went wrong", // error msg, the default value is 'Something went wrong'
    errors=[], // this stores additional details, where we can store different types of error, i.e. for multiple errors
    stack="" // stack contains information about where the error happened in the code, useful in debugging
  ){
    super(message) // basically ApiError is child of Error, super() calls the constructot of parent class, which is Error
    this.statusCode=statusCode
    this.data=null //
    this.message=message // this is custom property
    this.success=false // this is custom property
    this.errors=errors

    if(stack){
      this.stack=stack

    }else{
      Error.captureStackTrace(this,this.constructor)
    }
  }
}
export {ApiError};

//ApiError get the properties & behaviour of normal JS Error, but we can add our own properties, which are above written 
//so now, we can do : throw new ApiError(404,"User not found") instead of, throw new Error("User not found");