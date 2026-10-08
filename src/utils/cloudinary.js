import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"; // fs is file system library in node.js


// Configuration: This connects the backend to clousinary account
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME , 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFile=async (localFilePath)=>{ // localFilePath is uploadede at local server by MULTER
  
  try{
    if(!localFilePath) return null; // if no file file exists return null
    const response=await cloudinary.uploader.upload(localFilePath,{ // 'cloudinary.uploader.upload' means  cloudinary takes the file from local path & upload it on cloudinary
      resource_type:"auto" // 'resource_type' means whatever type of file like image.png is iamge, mp4 means video, so according to file type cloudinary will know the file type by its own , that's why we use 'auto'
    })
    //file has been uploaded successfully
    console.log("File is successfully uploaded on cloudinary", response.url);
    return response;
  }catch(error) {
     fs.unlinkSync(localFilePath); //if there is an error/ fails to upload, so remove that temporary stored file from local server 
     return null;

  }
}
export {uploadFile};

