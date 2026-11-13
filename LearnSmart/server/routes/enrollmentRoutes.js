const express = require("express");
const router = express.Router();

const {
  enrollInCourse,
  unenrollFromCourse,
  getMyEnrollments,
  getEnrollmentForCourse,
  toggleLesson,
  rateCourse,
} = require("../controllers/enrollmentController");

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Every enrollment route is for students only
router.use(protect, authorizeRoles("student"));

router.post("/", enrollInCourse);
router.get("/my-learning", getMyEnrollments);
router.get("/course/:courseId", getEnrollmentForCourse);
router.put("/:courseId/lessons/:lessonId", toggleLesson);
router.put("/:courseId/rating", rateCourse);
router.delete("/:courseId", unenrollFromCourse);

module.exports = router;
