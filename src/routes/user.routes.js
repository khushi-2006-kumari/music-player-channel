import {Router} from "express";
import {registerUser} from "../controllers/user.controller.js"

import {upload} from '../middlewares/multer.middleware.js'


const router=Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ]),
  registerUser
); // Define the route, define the /register endpoint,when POST request arrives at this route , it calls registerUser



//router.route("/login").post(login);

export default router; // we here write default because we can write any name for router, as in app.js we wrote as userRoutes