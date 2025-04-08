import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app = express();
// cors policy for client
const allowedOrigins = ["http://localhost:5173","*"];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({limit:"16kb",extended:true}));  // when data comes to the url, it will be in json format,extended makes it nested(you can send nested data in url)
app.use(express.static("public"));    // to store static data use a seperate folder to store data folder name is anything
app.use(cookieParser());    // to store data in cookies of user data to retrive user data and stored in cookies it coulde be working with server only

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

import userRouter from './routes/user.routes.js'
app.use("/api/v2/user",userRouter)

// importing productRoute
import productRouter from './routes/product.routes.js';
app.use("/api/v2/products", productRouter);
export default app;