// Small helpers shared by controllers
const mongoose = require("mongoose");

// Accepts an array or a comma separated string and returns a clean array of strings
const toList = (value) => {
  if (value === undefined || value === null) return [];
  const items = Array.isArray(value) ? value : String(value).split(",");
  return [
    ...new Set(
      items
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ].slice(0, 30);
};

// Escape user text before using it inside a RegExp
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Validate and clean a lessons array from the request body
const cleanLessons = (lessons) => {
  if (!Array.isArray(lessons)) return null;

  return lessons
    .filter((lesson) => lesson && typeof lesson.title === "string" && lesson.title.trim())
    .map((lesson) => ({
      ...(lesson._id && mongoose.isValidObjectId(lesson._id) ? { _id: lesson._id } : {}),
      title: lesson.title.trim(),
      content: typeof lesson.content === "string" ? lesson.content : "",
      videoUrl: typeof lesson.videoUrl === "string" ? lesson.videoUrl.trim() : "",
      duration: Math.max(0, Number(lesson.duration) || 0)
    }));
};

module.exports = { toList, escapeRegex, cleanLessons };
