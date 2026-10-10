import multer from "multer"; // multer is a middleware used in Node/Express to handle file uploads

/* 
By using crypto to generate unique name 
import crypto from "crypto";// crypto is built-in Node.js module, it is used to generate a random value for the filename

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/my-uploads')
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(16, function (err, raw) {
      if (err) return cb(err)
      cb(null, file.fieldname + '-' + raw.toString('hex'))
    })
  }
})

const upload = multer({ storage: storage })
*/


//here we use our originalNmae instead of generating name
const storage = multer.diskStorage({ //Here we are tellling to MULTER, I want to use diskStorage, & i want to decide where the file should & what its filename should be
  destination: function (req, file, cb) { //destination is a function and decides where the uploaded file will be stored
    cb(null, './public/temp') //here cb has two parameters , we can take more than two as well, where null means there is no error, and 2nd parameter tells the location of file 
  },
  filename: function (req, file, cb) { //filename is a function & decide what the uploaded file should be called
  
      cb(null, file.originalname) // here we use originalName of file & file 
    
  }
})

export const upload = multer({ storage: storage }) // it creates a multer middleware using the storage configuration we just created above

//function (req, file, cb): 
// req: is the HTTP request coming from the user
//file: contains information about the uploadede file, file is object
//cb: callback function, it tells Multer that I am finished deciding where to put the file


