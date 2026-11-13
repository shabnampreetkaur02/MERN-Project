const mongoose = require("mongoose");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const ROLES = ["student", "instructor", "admin"];

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Users fetched successfully",
      totalUsers: users.length,
      users
    });
  } catch (error) {
    console.error("Get users error:", error.message);
    return res.status(500).json({ message: "Server error while fetching users" });
  }
};

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [students, instructors, admins, published, drafts, enrollments] =
      await Promise.all([
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "instructor" }),
        User.countDocuments({ role: "admin" }),
        Course.countDocuments({ status: "published" }),
        Course.countDocuments({ status: "draft" }),
        Enrollment.countDocuments()
      ]);

    return res.status(200).json({
      users: { total: students + instructors + admins, students, instructors, admins },
      courses: { total: published + drafts, published, drafts },
      enrollments
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    return res.status(500).json({ message: "Server error while fetching statistics" });
  }
};

// PATCH /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: "Role must be student, instructor or admin" });
    }

    if (id === req.user.userId) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Role updated successfully", user });
  } catch (error) {
    console.error("Update role error:", error.message);
    return res.status(500).json({ message: "Server error while updating role" });
  }
};

// DELETE /api/admin/users/:id  (also removes their enrollments and courses)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: "User not found" });
    }

    if (id === req.user.userId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Courses created by this user and the enrollments in them
    const ownedCourseIds = (await Course.find({ instructor: id }).select("_id")).map(
      (course) => course._id
    );

    await Enrollment.deleteMany({ course: { $in: ownedCourseIds } });
    await Course.deleteMany({ instructor: id });

    // The user's own enrollments, then refresh the counters of those courses
    const ownEnrollments = await Enrollment.find({ student: id }).select("course");
    await Enrollment.deleteMany({ student: id });

    const affectedCourseIds = [...new Set(ownEnrollments.map((item) => item.course.toString()))];
    const { syncCourseStats } = require("./enrollmentController");

    await Promise.all(affectedCourseIds.map((courseId) => syncCourseStats(courseId)));

    await user.deleteOne();

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error.message);
    return res.status(500).json({ message: "Server error while deleting user" });
  }
};

module.exports = { getAllUsers, getStats, updateUserRole, deleteUser };
