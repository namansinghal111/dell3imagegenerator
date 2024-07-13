import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { config, uploader } from "cloudinary";
import OpenAI from "openai";
//
const app = express();
const PORT = 9000;

//!Connect to mongodb
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Monodb connected");
  })
  .catch((e) => console.log(e));

//!---Gallery model-----
const gallerySchema = new mongoose.Schema(
  {
    prompt: String,
    url: String,
    public_id: String,
  },
  {
    timestamps: true,
  }
);
const Gallery = mongoose.model("Gallery", gallerySchema);
//!Configure openai
const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});
//!Configure cloudinary
config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

//! Cors
app.use((req, res, next) => {
  //res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

/*
const corsOptions = {
  origin: [],
};*/

//!Middlewares
app.use(express.json());
const corsOptions = {
  headers: {
    //"Access-Control-Allow-Origin": "http://localhost:8000/",
    origin: 'https://aiimagegeneratorpro.netlify.app',
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
    
   // "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
   // withCredentials: true,
    //"Access-Control-Allow-Headers":
    //  "Origin, Accept, X-Requested-With, Content-Type",
  //  Accept: "application/json",
   // "Content-Type": "application/json",
    
  },
 // origin: process.env.CORSURL,
  
  //origin: process.env.CORSUR
  //credentials: true,
};
app.use(cors(corsOptions));

//!Route
app.post("/generate-image", async (req, res) => {
  const { prompt } = req.body;
  try {
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
    });
    //Save the image into cloudinary
    const image = await uploader.upload(imageResponse.data[0].url, {
      folder: "ai-art-work",
    });
    //Save into mongodb
    const imageCreated = await Gallery.create({
      prompt: imageResponse.data[0].revised_prompt,
      url: imageResponse.data[0].url,
      public_id: image.public_id,
    });
    res.json(imageCreated);
  } catch (error) {
    console.log(error);
    res.json({ message: "Error generating image" });
  }
});

//!List images route
app.get("/images", async (req, res) => {
  try {
    const images = await Gallery.find();
    res.json(images);
  } catch (error) {
    res.json({ message: "Error fetching images" });
  }
});
//!Start the server
app.listen(PORT, console.log("Server is running..."));
