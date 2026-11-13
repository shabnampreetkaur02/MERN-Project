const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");

const HIDE_LESSON_CONTENT = "-lessons.content -lessons.videoUrl";

// Progress = finished lessons / total lessons (ignores lessons that were deleted)
const calcProgress = (completedLessons, lessons) => {
  if (!lessons || lessons.length === 0) return 0;

  const lessonIds = new Set(lessons.map((lesson) => lesson._id.toString()));
  const done = new Set(
    completedLessons.map((id) => id.toString()).filter((id) => lessonIds.has(id))
  );

  return Math.round((done.size / lessons.length) * 100);
};

// Recalculate enrolled count and rating from the enrollments, so the numbers never drift
const syncCourseStats = async (courseId) => {
  const id = new mongoose.Types.ObjectId(courseId);

  const [enrolledCount, ratingStats] = await Promise.all([
    Enrollment.countDocuments({ course: id }),
    Enrollment.aggregate([
      { $match: { course: id, rating: { $ne: null } } },
      { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]),
  ]);

  const stats = ratingStats[0];

  await Course.findByIdAndUpdate(id, {
    enrolledCount,
    averageRating: stats ? Math.round(stats.average * 10) / 10 : 0,
    ratingCount: stats ? stats.count : 0,
  });
};

// Enrollment object for the client, with fresh progress
const withProgress = (enrollment, lessons) => {
  const data = enrollment.toObject ? enrollment.toObject() : enrollment;
  data.progress = calcProgress(data.completedLessons || [], lessons);
  data.status = data.progress === 100 ? "completed" : "active";
  return data;
};

// ================= ENROLL =================

const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const course = await Course.findOne({ _id: courseId, status: "published" });

    if (!course) {
      return res.status(404).json({ message: "Published course not found" });
    }

    const existingEnrollment = await Enrollment.findOne({
      student: req.user.userId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(409).json({ message: "You are already enrolled in this course" });
    }

    const enrollment = await Enrollment.create({
      student: req.user.userId,
      course: courseId,
    });

    await syncCourseStats(courseId);

    return res.status(201).json({
      message: "Successfully enrolled in course",
      enrollment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You are already enrolled in this course" });
    }

    console.error("Enrollment error:", error);
    return res.status(500).json({ message: "Error enrolling in course" });
  }
};

// ================= UNENROLL =================

const unenrollFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const enrollment = await Enrollment.findOneAndDelete({
      student: req.user.userId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ message: "You are not enrolled in this course" });
    }

    await syncCourseStats(courseId);

    return res.status(200).json({ message: "You have left the course" });
  } catch (error) {
    console.error("Unenroll error:", error);
    return res.status(500).json({ message: "Error leaving course" });
  }
};

// ================= MY LEARNING =================

const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.userId })
      .populate({
        path: "course",
        match: { status: "published" },
        select: HIDE_LESSON_CONTENT,
        populate: { path: "instructor", select: "name" },
      })
      .sort({ enrolledAt: -1 });

    // Remove enrollments whose courses were deleted or unpublished
    const validEnrollments = enrollments
      .filter((enrollment) => enrollment.course !== null)
      .map((enrollment) => {
        const data = withProgress(enrollment, enrollment.course.lessons);
        const { lessons, ...course } = data.course;

        data.course = { ...course, lessonCount: lessons.length };
        return data;
      });

    return res.status(200).json({
      count: validEnrollments.length,
      enrollments: validEnrollments,
    });
  } catch (error) {
    console.error("Fetch enrollments error:", error);
    return res.status(500).json({ message: "Error fetching your courses" });
  }
};

// ================= ONE ENROLLMENT (used by the lesson page) =================

const getEnrollmentForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user.userId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ message: "You are not enrolled in this course" });
    }

    const course = await Course.findById(courseId).select("lessons._id");

    return res.status(200).json({
      enrollment: withProgress(enrollment, course ? course.lessons : []),
    });
  } catch (error) {
    console.error("Fetch enrollment error:", error);
    return res.status(500).json({ message: "Error fetching enrollment" });
  }
};

// ================= MARK A LESSON DONE / NOT DONE =================

const toggleLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    if (!mongoose.isValidObjectId(courseId) || !mongoose.isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid course or lesson ID" });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user.userId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ message: "You are not enrolled in this course" });
    }

    const course = await Course.findById(courseId).select("lessons._id");

    if (!course || !course.lessons.id(lessonId)) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const alreadyDone = enrollment.completedLessons.some(
      (id) => id.toString() === lessonId
    );

    if (alreadyDone) {
      enrollment.completedLessons = enrollment.completedLessons.filter(
        (id) => id.toString() !== lessonId
      );
    } else {
      enrollment.completedLessons.push(lessonId);
    }

    enrollment.progress = calcProgress(enrollment.completedLessons, course.lessons);
    enrollment.status = enrollment.progress === 100 ? "completed" : "active";

    await enrollment.save();

    return res.status(200).json({
      message: alreadyDone ? "Lesson marked as not done" : "Lesson completed",
      enrollment: withProgress(enrollment, course.lessons),
    });
  } catch (error) {
    console.error("Lesson progress error:", error);
    return res.status(500).json({ message: "Error updating progress" });
  }
};

// ================= RATE A COURSE =================

const rateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, review } = req.body;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const value = Number(rating);

    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return res.status(400).json({ message: "Rating must be a whole number from 1 to 5" });
    }

    if (review !== undefined && (typeof review !== "string" || review.length > 500)) {
      return res.status(400).json({ message: "Review must be text of up to 500 characters" });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user.userId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(403).json({ message: "Enroll in this course before rating it" });
    }

    enrollment.rating = value;
    enrollment.review = (review || "").trim();
    await enrollment.save();

    await syncCourseStats(courseId);

    const course = await Course.findById(courseId).select("averageRating ratingCount");

    return res.status(200).json({
      message: "Thanks for your feedback!",
      rating: enrollment.rating,
      review: enrollment.review,
      averageRating: course?.averageRating ?? 0,
      ratingCount: course?.ratingCount ?? 0,
    });
  } catch (error) {
    console.error("Rating error:", error);
    return res.status(500).json({ message: "Error saving your rating" });
  }
};

module.exports = {
  enrollInCourse,
  unenrollFromCourse,
  getMyEnrollments,
  getEnrollmentForCourse,
  toggleLesson,
  rateCourse,
  syncCourseStats,
};
