
const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(
  {

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },

    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student"
    },

    interests: {
      type: [String],
      default: []
    },

    skills: {
      type: [String],
      default: []
    },

    learningPreferences: {
      preferredLevel: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner"
      },

      preferredCategories: {
        type: [String],
        default: []
      }
    }
  },
  {
    timestamps: true
  }
);


const User = mongoose.model("User", userSchema);

module.exports = User;
