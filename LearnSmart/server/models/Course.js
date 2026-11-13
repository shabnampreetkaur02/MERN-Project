const mongoose = require("mongoose");

// A single lesson inside a course
const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, default: "" },
  videoUrl: { type: String, default: "", trim: true },
  duration: { type: Number, default: 0, min: 0 } // minutes
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    category: { type: String, required: true, trim: true },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    },
    skills: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    price: { type: Number, default: 0, min: 0 },
    thumbnail: { type: String, default: "" },
    duration: { type: Number, default: 0, min: 0 }, // weeks
    lessons: { type: [lessonSchema], default: [] },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    enrolledCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    }
  },
  { timestamps: true }
);

courseSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model("Course", courseSchema);
