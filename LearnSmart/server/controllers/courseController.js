const mongoose = require("mongoose");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const { toList, escapeRegex, cleanLessons } = require("../utils");

const LEVELS = ["beginner", "intermediate", "advanced"];

// Lesson content and video links are only for enrolled students, the owner and admins
const HIDE_LESSON_CONTENT = "-lessons.content -lessons.videoUrl";

const SORT_OPTIONS = {
    newest: { createdAt: -1 },
    popular: { enrolledCount: -1 },
    rating: { averageRating: -1, ratingCount: -1 },
    "price-low": { price: 1 },
    "price-high": { price: -1 }
};

// Turn mongoose validation errors into a 400 response, everything else into a 500
const sendError = (res, error, fallbackMessage) => {
    if (error.name === "ValidationError") {
        return res.status(400).json({
            message: Object.values(error.errors)[0]?.message || "Invalid course data"
        });
    }

    console.error(fallbackMessage, error);
    return res.status(500).json({ message: fallbackMessage });
};

// ================= CREATE COURSE =================

const createCourse = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            level,
            skills,
            tags,
            price,
            thumbnail,
            duration,
            status,
            lessons
        } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({
                message: "Title, description and category are required"
            });
        }

        const course = await Course.create({
            title,
            description,
            category,
            instructor: req.user.userId,
            level,
            skills: toList(skills),
            tags: toList(tags),
            price,
            thumbnail,
            duration,
            status,
            lessons: cleanLessons(lessons) || []
        });

        return res.status(201).json({
            message: "Course created successfully",
            course
        });
    } catch (error) {
        return sendError(res, error, "Error creating course");
    }
};

// ================= GET ALL PUBLISHED COURSES (search, filter, sort) =================

const getCourses = async (req, res) => {
    try {
        const { search, category, level, sort } = req.query;

        const filter = { status: "published" };

        if (typeof category === "string" && category.trim()) {
            filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, "i");
        }

        if (LEVELS.includes(level)) {
            filter.level = level;
        }

        if (typeof search === "string" && search.trim()) {
            const pattern = new RegExp(escapeRegex(search.trim()), "i");
            filter.$or = [
                { title: pattern },
                { description: pattern },
                { category: pattern },
                { skills: pattern },
                { tags: pattern }
            ];
        }

        const courses = await Course.find(filter)
            .select(HIDE_LESSON_CONTENT)
            .sort(SORT_OPTIONS[sort] || SORT_OPTIONS.newest)
            .populate("instructor", "name")
            .lean();

        const list = courses.map(({ lessons, ...course }) => ({
            ...course,
            lessonCount: (lessons || []).length
        }));

        return res.status(200).json({
            count: list.length,
            courses: list
        });
    } catch (error) {
        return sendError(res, error, "Error fetching courses");
    }
};

// ================= GET CATEGORIES =================

const getCategories = async (req, res) => {
    try {
        const categories = await Course.distinct("category", { status: "published" });

        categories.sort((a, b) => a.localeCompare(b));

        return res.status(200).json({ categories });
    } catch (error) {
        return sendError(res, error, "Error fetching categories");
    }
};

// ================= GET MY COURSES (instructor, includes drafts) =================

const getMyCourses = async (req, res) => {
    try {
        const courses = await Course.find({ instructor: req.user.userId })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: courses.length,
            courses
        });
    } catch (error) {
        return sendError(res, error, "Error fetching your courses");
    }
};

// ================= GET EVERY COURSE (admin, includes drafts) =================

const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find()
            .select(HIDE_LESSON_CONTENT)
            .sort({ createdAt: -1 })
            .populate("instructor", "name email");

        return res.status(200).json({
            count: courses.length,
            courses
        });
    } catch (error) {
        return sendError(res, error, "Error fetching courses");
    }
};

// ================= GET SINGLE COURSE =================

const getCourseById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Course not found" });
        }

        const course = await Course.findById(req.params.id)
            .populate("instructor", "name");

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const userId = req.user?.userId;
        const role = req.user?.role;

        const isOwner = Boolean(userId) && course.instructor?._id.toString() === userId;
        const isAdmin = role === "admin";

        // Draft courses are private
        if (course.status !== "published" && !isOwner && !isAdmin) {
            return res.status(404).json({ message: "Course not found" });
        }

        const enrolled = role === "student"
            ? await Enrollment.exists({ student: userId, course: course._id })
            : null;

        const canViewContent = Boolean(isOwner || isAdmin || enrolled);

        const data = course.toObject();
        data.lessonCount = data.lessons.length;

        if (!canViewContent) {
            data.lessons = data.lessons.map(({ _id, title, duration }) => ({
                _id,
                title,
                duration
            }));
        }

        return res.status(200).json({
            course: data,
            canViewContent
        });
    } catch (error) {
        return sendError(res, error, "Error fetching course");
    }
};

// ================= GET COURSE REVIEWS =================

const getCourseReviews = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Course not found" });
        }

        const enrollments = await Enrollment.find({
            course: req.params.id,
            rating: { $ne: null }
        })
            .populate("student", "name")
            .sort({ updatedAt: -1 })
            .limit(50);

        const reviews = enrollments.map((item) => ({
            _id: item._id,
            studentName: item.student?.name || "Student",
            rating: item.rating,
            review: item.review,
            createdAt: item.updatedAt
        }));

        return res.status(200).json({
            count: reviews.length,
            reviews
        });
    } catch (error) {
        return sendError(res, error, "Error fetching reviews");
    }
};

// ================= UPDATE COURSE =================

const updateCourse = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Course not found" });
        }

        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const isOwner = course.instructor.toString() === req.user.userId;
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: "You cannot update this course"
            });
        }

        // Only allow approved fields to be updated
        const allowedFields = [
            "title",
            "description",
            "category",
            "level",
            "price",
            "thumbnail",
            "duration",
            "status"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                course[field] = req.body[field];
            }
        });

        if (req.body.skills !== undefined) course.skills = toList(req.body.skills);
        if (req.body.tags !== undefined) course.tags = toList(req.body.tags);

        if (req.body.lessons !== undefined) {
            const lessons = cleanLessons(req.body.lessons);

            if (lessons === null) {
                return res.status(400).json({ message: "Lessons must be a list" });
            }

            course.lessons = lessons;
        }

        await course.save();

        return res.status(200).json({
            message: "Course updated successfully",
            course
        });
    } catch (error) {
        return sendError(res, error, "Error updating course");
    }
};

// ================= DELETE COURSE =================

const deleteCourse = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Course not found" });
        }

        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const isOwner = course.instructor.toString() === req.user.userId;
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: "You cannot delete this course"
            });
        }

        // Remove the enrollments of this course too, so nothing is left behind
        await Enrollment.deleteMany({ course: course._id });
        await course.deleteOne();

        return res.status(200).json({
            message: "Course deleted successfully"
        });
    } catch (error) {
        return sendError(res, error, "Error deleting course");
    }
};

module.exports = {
    createCourse,
    getCourses,
    getCategories,
    getMyCourses,
    getAllCourses,
    getCourseById,
    getCourseReviews,
    updateCourse,
    deleteCourse
};
