import mongoose from "mongoose";
const DB_NAME = "test-google-signin";
const connectDB = async()=>{
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`\nMongodb connected!!!: DB Host: ${connectionInstance.connection.host}\n`);
  } catch (error) {
    console.log("getting error")
    console.log("Mongodb connection error",error);
    process.exit(1);
  }
}
export default connectDB;