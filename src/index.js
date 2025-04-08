import dotenv from 'dotenv';
dotenv.config({path:'./.env'});
import connectDB from './db/config.Db.js';
import app from './app.js';

connectDB()
.then(() =>{
  app.listen(process.env.PORT || 4040, ()=>{
    console.log(`server is listening on port ${process.env.PORT}`);
  })
})
.catch(err=>{
  console.log(`Mongodb Connection error: ${err}`);
});