import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API, { errorMessage } from "../services/api";
import ProgressBar from "../components/ProgressBar";
import { formatLevel } from "../components/CourseCard";

function MyLearning() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    API.get("/enrollments/my-learning")
      .then((response) => setEnrollments(response.data.enrollments || []))
      .catch((err) => setMessage(errorMessage(err, "Could not load your courses.")))
      .finally(() => setLoading(false));
  }, []);

  const handleLeave = async (courseId) => {
    if (!window.confirm("Leave this course? Your progress and rating will be removed.")) return;

    try {
      await API.delete(`/enrollments/${courseId}`);
      setEnrollments((prev) => prev.filter((item) => item.course._id !== courseId));
    } catch (err) {
      setMessage(errorMessage(err, "Could not leave the course."));
    }
  };

  return (
    <section className="courses-section">
      <div className="section-heading">
        <h2>My Learning</h2>
        <p>Your enrolled courses and progress.</p>
      </div>

      {loading && <p className="course-status">Loading your courses...</p>}
      {message && <p className="course-status">{message}</p>}

      {!loading && enrollments.length === 0 && (
        <p className="course-status">
          You have not enrolled in any course yet. <Link to="/courses">Browse courses</Link>
        </p>
      )}

      <div className="course-grid">
        {enrollments.map((item) => (
          <div className="course-card" key={item._id}>
            <span className="course-category">{item.course.category}</span>
            <h3>{item.course.title}</h3>

            <div className="course-info">
              <span>📊 {formatLevel(item.course.level)}</span>
              <span>🎬 {item.course.lessonCount} lessons</span>
              <span>{item.status === "completed" ? "✅ Completed" : "📖 In progress"}</span>
            </div>

            <div className="progress-label">
              <span>Progress</span>
              <strong>{item.progress}%</strong>
            </div>
            <ProgressBar value={item.progress} />

            <Link className="course-btn btn-link btn-spaced" to={`/learn/${item.course._id}`}>
              {item.progress === 0 ? "Start Learning →" : "Continue Learning →"}
            </Link>
            <button className="text-btn" onClick={() => handleLeave(item.course._id)}>
              Leave course
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default MyLearning;
