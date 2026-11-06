import mongoose,{Schema} from mongoose;
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema=new Schema({
  content:{
    type:String,
    required:true
  },
  
  owner:
    {
      type:Schema.Types.ObjectId,
      ref:"User"
    },
  

  tweetTo:
    {
      type:Schema.Types.ObjectId,
      ref:"Video"
    }
  



},{timestamps:true});

tweetSchema.plugin(mongooseAggregatePaginate);

export const Tweet=model.Schema("Tweet",tweetSchema);