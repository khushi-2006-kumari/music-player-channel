import mongoose,{Schema} from mongoose;

const playlistSchema=new Schema({

  owner:
    {
      type:Schema.Types.ObjectId,
      ref:"User"
    },
  
  
  description:{
    type:String,
    required:true
  },

  uploadVideos:[
    {
      type:Schema.Types.ObjectId,
      ref:"Video"
    }
  ],

  name:{
    type:String,
    required:true
  }
   
},{timestamps:true});

export const Playlist=mongoose.model("Playlist",playlistSchema);