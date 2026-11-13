const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// Hybrid recommendation: content-based score (interests/skills/preferences vs course)
// plus a popularity score (rating and enrollments).
const getRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Courses the student already joined should not be recommended again
    const enrolledIds = (
      await Enrollment.find({ student: user._id }).select("course")
    ).map((item) => item.course);

    const courses = await Course.find({
      status: "published",
      _id: { $nin: enrolledIds }
    })
      .select("-lessons.content -lessons.videoUrl")
      .populate("instructor", "name")
      .lean();

    const interests = [
      ...new Set(
        [...(user.interests || []), ...(user.skills || [])]
          .map((item) => item.toLowerCase().trim())
          .filter(Boolean)
      )
    ];

    const preferredLevel = user.learningPreferences?.preferredLevel;
    const preferredCategories = (user.learningPreferences?.preferredCategories || [])
      .map((item) => item.toLowerCase().trim());

    const recommendations = courses.map(({ lessons, ...course }) => {
      const courseText = [
        course.title,
        course.description,
        course.category,
        ...(course.skills || []),
        ...(course.tags || [])
      ].join(" ").toLowerCase();

      // Content-based score: +10 for every interest or skill found in the course
      const matchedInterests = interests.filter((interest) =>
        courseText.includes(interest)
      );

      let contentScore = matchedInterests.length * 10;

      // Small bonuses for the learning preferences
      if (preferredLevel && course.level === preferredLevel) contentScore += 3;
      if (preferredCategories.includes((course.category || "").toLowerCase())) {
        contentScore += 5;
      }

      // Popularity-based score
      const ratingScore = (course.averageRating || 0) * 4;
      const enrollmentScore = Math.min(course.enrolledCount || 0, 100) / 10;
      const popularityScore = ratingScore + enrollmentScore;

      return {
        course: { ...course, lessonCount: (lessons || []).length },
        matchedInterests,
        contentScore,
        popularityScore: Math.round(popularityScore * 10) / 10,
        finalScore: Math.round((contentScore + popularityScore) * 10) / 10
      };
    });

    recommendations.sort((a, b) => b.finalScore - a.finalScore);

    return res.status(200).json({
      message: "Recommendations fetched successfully",
      count: recommendations.length,
      hasInterests: interests.length > 0,
      recommendations
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    return res.status(500).json({ message: "Error generating recommendations" });
  }
};

module.exports = { getRecommendations };
