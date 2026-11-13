const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getStats,
  updateUserRole,
  deleteUser
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Everything here is admin only
router.use(protect, authorizeRoles("admin"));

router.get("/users", getAllUsers);
router.get("/stats", getStats);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

module.exports = router;
