const express = require("express");
const router = express.Router();

const {
    createCourse,
    getCourses,
    getCategories,
    getMyCourses,
    getAllCourses,
    getCourseById,
    getCourseReviews,
    updateCourse,
    deleteCourse
} = require("../controllers/courseController");

const { protect, optionalAuth } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Public: published courses (supports ?search=&category=&level=&sort=)
router.get("/", getCourses);

// Public: list of categories used for filters
router.get("/categories", getCategories);

// Instructor/admin: own courses including drafts
router.get("/mine", protect, authorizeRoles("instructor", "admin"), getMyCourses);

// Admin: every course including drafts
router.get("/all", protect, authorizeRoles("admin"), getAllCourses);

// Create course
router.post("/", protect, authorizeRoles("instructor", "admin"), createCourse);

// Public: reviews of a course
router.get("/:id/reviews", getCourseReviews);

// Get single course. Guests can see published courses; lesson content is only for
// enrolled students, the course owner and admins
router.get("/:id", optionalAuth, getCourseById);

// Update / delete course (controller checks ownership)
router.put("/:id", protect, authorizeRoles("instructor", "admin"), updateCourse);
router.delete("/:id", protect, authorizeRoles("instructor", "admin"), deleteCourse);

module.exports = router;
