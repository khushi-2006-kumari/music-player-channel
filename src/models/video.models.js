import mongoose, {Schema} from 'mongoose';
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";



const videoSchema=new Schema({
  videoFile:{
    type:String, //from cloudinary url
    required:true
  },
  thumbnail:{
    type:String, //from cloudinary url
    required:true
  },
  title:{
    type:String,
    required:true
  },
  owner:{
    type:Schema.Types.ObjectId,
    ref:"User"
  },
  description:{
    type:String,
    required:true
  },
  duration:{
    type:Number,  //from cloudinary url
    required:true
  },
  views:{
    type:Number,
    required:true,
    default:0
  },
  isPublished:{
    type:String,
    default:true
  },

    
},{timestamps:true});

videoSchema.plugin(mongooseAggregatePaginate); // we use method as videoSchema is an object and use funnction plugin

export const Video=mongoose.model("Video",videoSchema);