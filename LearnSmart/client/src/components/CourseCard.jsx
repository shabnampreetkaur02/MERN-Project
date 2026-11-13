import { Link } from "react-router-dom";

export const formatLevel = (level) =>
  level ? level.charAt(0).toUpperCase() + level.slice(1) : "Beginner";

export const formatDuration = (weeks) =>
  weeks ? `${weeks} week${weeks > 1 ? "s" : ""}` : "Self-paced";

export const formatPrice = (price) => (price ? `₹${price}` : "Free");

function CourseCard({ course, icon = "📚", children }) {
  return (
    <div className="course-card">
      <div className="course-icon">{icon}</div>

      <span className="course-category">{course.category}</span>

      <h3>{course.title}</h3>

      <p>{course.description}</p>

      <div className="course-info">
        <span>📊 {formatLevel(course.level)}</span>
        <span>🕒 {formatDuration(course.duration)}</span>
        <span>🎬 {course.lessonCount || 0} lessons</span>
        <span>
          ⭐ {course.ratingCount ? `${course.averageRating} (${course.ratingCount})` : "No ratings yet"}
        </span>
        <span>💰 {formatPrice(course.price)}</span>
      </div>

      {children}

      <Link className="course-btn btn-link" to={`/courses/${course._id}`}>
        View Course →
      </Link>
    </div>
  );
}

export default CourseCard;
