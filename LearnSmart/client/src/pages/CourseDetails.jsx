import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import StarRating from "../components/StarRating";
import { formatDuration, formatLevel, formatPrice } from "../components/CourseCard";

function CourseDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [canViewContent, setCanViewContent] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const loadCourse = useCallback(async () => {
    try {
      const [courseResponse, reviewResponse] = await Promise.all([
        API.get(`/courses/${id}`),
        API.get(`/courses/${id}/reviews`),
      ]);

      setCourse(courseResponse.data.course);
      setCanViewContent(courseResponse.data.canViewContent);
      setReviews(reviewResponse.data.reviews || []);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Could not load this course."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const handleEnroll = async () => {
    setBusy(true);
    setMessage("");

    try {
      await API.post("/enrollments", { courseId: id });
      await loadCourse();
      setMessage("You are enrolled! Start with the first lesson.");
    } catch (err) {
      setMessage(errorMessage(err, "Could not enroll. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm("Leave this course? Your progress and rating will be removed.")) return;

    setBusy(true);
    setMessage("");

    try {
      await API.delete(`/enrollments/${id}`);
      await loadCourse();
      setMessage("You have left the course.");
    } catch (err) {
      setMessage(errorMessage(err, "Could not leave the course."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="course-status">Loading course...</p>;

  if (error || !course) {
    return (
      <div className="instructor-form-card">
        <p className="course-status">{error || "Course not found."}</p>
        <Link className="back-link" to="/courses">
          ← Back to courses
        </Link>
      </div>
    );
  }

  const isStudent = user?.role === "student";
  const isEnrolled = isStudent && canViewContent;

  return (
    <div className="instructor-form-card">
      <Link className="back-link" to="/courses">
        ← Back to courses
      </Link>

      <span className="course-category">{course.category}</span>
      {course.status === "draft" && <span className="badge badge-draft">Draft</span>}
      <h2>{course.title}</h2>
      <p>{course.description}</p>

      <div className="detail-meta">
        <span>👤 {course.instructor?.name || "Instructor"}</span>
        <span>📊 {formatLevel(course.level)}</span>
        <span>🕒 {formatDuration(course.duration)}</span>
        <span>🎬 {course.lessonCount} lessons</span>
        <span>👥 {course.enrolledCount} enrolled</span>
        <span>💰 {formatPrice(course.price)}</span>
      </div>

      <div className="detail-rating">
        <StarRating value={course.averageRating} />
        <span>
          {course.ratingCount
            ? `${course.averageRating} out of 5 (${course.ratingCount} rating${course.ratingCount > 1 ? "s" : ""})`
            : "No ratings yet"}
        </span>
      </div>

      {(course.skills?.length > 0 || course.tags?.length > 0) && (
        <div className="chip-row">
          {[...course.skills, ...course.tags].map((item) => (
            <span className="chip" key={item}>
              {item}
            </span>
          ))}
        </div>
      )}

      <div className="detail-actions">
        {!user && (
          <Link className="signup-btn btn-link" to="/login" state={{ from: `/courses/${id}` }}>
            Login to Enroll
          </Link>
        )}

        {isStudent && !isEnrolled && (
          <button className="signup-btn" onClick={handleEnroll} disabled={busy}>
            {busy ? "Please wait..." : "Enroll Now"}
          </button>
        )}

        {isEnrolled && (
          <>
            <Link className="signup-btn btn-link" to={`/learn/${id}`}>
              Continue Learning →
            </Link>
            <button className="login-btn" onClick={handleLeave} disabled={busy}>
              Leave Course
            </button>
          </>
        )}

        {user && !isStudent && (
          <p className="dashboard-note">Only student accounts can enroll in courses.</p>
        )}
      </div>

      {message && <p className="instructor-message">{message}</p>}

      <h3 className="detail-heading">Course Content</h3>

      {course.lessons.length === 0 ? (
        <p className="dashboard-note">The instructor has not added lessons yet.</p>
      ) : (
        <ol className="lesson-outline">
          {course.lessons.map((lesson) => (
            <li key={lesson._id}>
              <span>
                {canViewContent ? "▶" : "🔒"} {lesson.title}
              </span>
              {lesson.duration > 0 && <small>{lesson.duration} min</small>}
            </li>
          ))}
        </ol>
      )}

      {!canViewContent && course.lessons.length > 0 && (
        <p className="dashboard-note">Enroll to unlock the lesson content.</p>
      )}

      <h3 className="detail-heading">Reviews</h3>

      {reviews.length === 0 ? (
        <p className="dashboard-note">No reviews yet. Be the first to rate this course!</p>
      ) : (
        <div className="review-list">
          {reviews.map((review) => (
            <div className="review" key={review._id}>
              <div className="review-top">
                <strong>{review.studentName}</strong>
                <StarRating value={review.rating} />
              </div>
              {review.review && <p>{review.review}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CourseDetails;
