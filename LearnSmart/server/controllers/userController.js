const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { toList } = require("../utils");

const LEVELS = ["beginner", "intermediate", "advanced"];

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  interests: user.interests,
  skills: user.skills,
  learningPreferences: user.learningPreferences
});

// GET /api/users/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      user: publicUser(user)
    });
  } catch (error) {
    console.error("Profile error:", error.message);
    return res.status(500).json({ message: "Server error while fetching profile" });
  }
};

// PUT /api/users/me  - update name, interests, skills and preferences
const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, interests, skills, learningPreferences } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      user.name = name.trim();
    }

    if (interests !== undefined) user.interests = toList(interests);
    if (skills !== undefined) user.skills = toList(skills);

    if (learningPreferences) {
      const { preferredLevel, preferredCategories } = learningPreferences;

      if (preferredLevel !== undefined) {
        if (!LEVELS.includes(preferredLevel)) {
          return res.status(400).json({ message: "Invalid preferred level" });
        }
        user.learningPreferences.preferredLevel = preferredLevel;
      }

      if (preferredCategories !== undefined) {
        user.learningPreferences.preferredCategories = toList(preferredCategories);
      }
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: publicUser(user)
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ message: "Server error while updating profile" });
  }
};

// PUT /api/users/me/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const user = await User.findById(req.user.userId).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error.message);
    return res.status(500).json({ message: "Server error while changing password" });
  }
};

module.exports = { getMe, updateMe, changePassword };
