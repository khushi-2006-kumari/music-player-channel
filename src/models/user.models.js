import mongoose, {Schema} from "mongoose";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema=new Schema({
    userName:{
       type:String,
       required:true,
       trim:true,
       index:true,
       lowercase:true,
       unique:true
    },
    email:{
       type:String,
       required:true,
       trim:true,
       
       lowercase:true,
       unique:true
    },
    fullName:{
       type:String,
       required:true,
       trim:true,
    },
    avatar:{
      type:String,
      required:true
    },
    coverImage:{
      type:String // use third party like clodinary,aws
    },
    password:{
      type:String,
      required:[true, 'Password is required']
    },
    refreshToken:{
       type:String
    },
    watchHistory:[
      {
        type:Schema.Types.ObjectId,
        ref:"Video"
      }
    ]
    
},{
  timestamps:true
});

userSchema.pre("save",async function(next){ // we can't use here arrow function becoz we can't get access 'this'
  if(!this.isModified("password")) return next(); // if the "password" is not modified so return next(), note one thing we write 'return next()' instead of 'next()' becoz we don't want to run the below line of code so return from this line 
  this.password= await bcrypt.hash(this.password,10); // here we store password in mongoDB after hash the passwod that's why we use bcrypt library, because mongoDb stores hashed password, not the users enterd password, and when we enter later so it compare the stored hashed password with entered password
  next(); // now it runs to tell that the function is done now mongoose can do save operation
})

userSchema.methods.isPasswordCorrect=  //  it means creates a custom method that every user document can use, and whose name is 'isPasswordCorrect'
  async function(password){ // it is asynchronous, so use async
    return await bcrypt.compare(password,this.password); // here password: entered by user, this.password means hashed password, basically bcrypt compare what we give data with stored in mogodb data
  } // it return in boolean means true ot false, true means matched otherwise false

  userSchema.methods.generateAccessToken=function(){
    jwt.sign(
      {
        id:this.id,
        userName:this.userName,
        email:this.email,
        fullName:this.fullName
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
      }
    )
  }
  userSchema.methods.generateRefreshToken=function(){
    jwt.sign(
      {
        id:this.id,
        userName:this.userName,
        email:this.email,
        fullName:this.fullName
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
      }
    )
  }

export const User=mongoose.model("User", userSchema);
