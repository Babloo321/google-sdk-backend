import mongoose from 'mongoose';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: function () { return !this.isGoogleAuth; }, // only required if not Google auth
    unique: true,
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: function () { return !this.isGoogleAuth; }, // not required for Google users
  },
  isGoogleAuth: {
    type: Boolean,
    default: false,
  },
  name: String,
  picture: {
    type:String,
    required:false
  },
  pictureId:{
    type:String,
    required:false
  },
  refreshToken: String,
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ userName: 1 }, { unique: true });
userSchema.pre("save",async function(next){
  if(!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password,salt);
});


userSchema.methods.generateAccessToken = function(){
  return jwt.sign(
    {
      _id:this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  )
}

userSchema.methods.generateRefreshTokenToken = function(){
  return jwt.sign(
    {
      _id:this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}
userSchema.methods.isPasswordCorrect = async function(password){
  return await bcrypt.compare(password,this.password)
}
const User = mongoose.model('User', userSchema);

export default User;
