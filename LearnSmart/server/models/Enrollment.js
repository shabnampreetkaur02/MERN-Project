const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    enrolledAt: { type: Date, default: Date.now },

    // Ids of lessons the student has finished
    completedLessons: {
      type: [mongoose.Schema.Types.ObjectId],
      default: []
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active"
    },

    // Optional rating and review given by the student
    rating: { type: Number, min: 1, max: 5, default: null },
    review: { type: String, trim: true, maxlength: 500, default: "" }
  },
  { timestamps: true }
);

// A student can enroll in a course only once
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
