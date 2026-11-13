import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API, { errorMessage } from "../services/api";
import ProgressBar from "../components/ProgressBar";
import StarRating from "../components/StarRating";

// Turns a normal YouTube link into an embeddable one (returns null for other links)
const getYouTubeEmbed = (url) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

function Learn() {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [ratingMessage, setRatingMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    Promise.all([
      API.get(`/courses/${courseId}`),
      API.get(`/enrollments/course/${courseId}`),
    ])
      .then(([courseResponse, enrollmentResponse]) => {
        if (ignore) return;

        const loadedCourse = courseResponse.data.course;
        const loadedEnrollment = enrollmentResponse.data.enrollment;
        const done = new Set(loadedEnrollment.completedLessons);
        const firstTodo = loadedCourse.lessons.find((lesson) => !done.has(lesson._id));

        setCourse(loadedCourse);
        setEnrollment(loadedEnrollment);
        setSelectedId((firstTodo || loadedCourse.lessons[0])?._id || null);
        setRating(loadedEnrollment.rating || 0);
        setReview(loadedEnrollment.review || "");
      })
      .catch((err) => {
        if (!ignore) setError(errorMessage(err, "Could not load this course."));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [courseId]);

  const toggleLesson = useCallback(
    async (lessonId) => {
      setBusy(true);

      try {
        const response = await API.put(`/enrollments/${courseId}/lessons/${lessonId}`);
        setEnrollment(response.data.enrollment);
      } catch (err) {
        setError(errorMessage(err, "Could not update your progress."));
      } finally {
        setBusy(false);
      }
    },
    [courseId]
  );

  const submitRating = async (e) => {
    e.preventDefault();
    setRatingMessage("");

    if (!rating) {
      setRatingMessage("Please choose a star rating first.");
      return;
    }

    try {
      const response = await API.put(`/enrollments/${courseId}/rating`, { rating, review });
      setRatingMessage(response.data.message);
      setCourse((prev) => ({
        ...prev,
        averageRating: response.data.averageRating,
        ratingCount: response.data.ratingCount,
      }));
    } catch (err) {
      setRatingMessage(errorMessage(err, "Could not save your rating."));
    }
  };

  if (loading) return <p className="course-status">Loading course...</p>;

  if (error && !course) {
    return (
      <div className="instructor-form-card">
        <p className="course-status">{error}</p>
        <Link className="back-link" to="/my-learning">
          ← Back to My Learning
        </Link>
      </div>
    );
  }

  const lessons = course.lessons;
  const completed = new Set(enrollment.completedLessons);
  const selectedIndex = lessons.findIndex((lesson) => lesson._id === selectedId);
  const selected = lessons[selectedIndex];
  const nextLesson = lessons[selectedIndex + 1];
  const embedUrl = selected?.videoUrl ? getYouTubeEmbed(selected.videoUrl) : null;

  return (
    <section className="learn-page">
      <Link className="back-link" to="/my-learning">
        ← My Learning
      </Link>

      <div className="learn-header">
        <div>
          <span className="course-category">{course.category}</span>
          <h2>{course.title}</h2>
        </div>

        <div className="learn-progress">
          <div className="progress-label">
            <span>{enrollment.status === "completed" ? "Completed 🎉" : "Your progress"}</span>
            <strong>{enrollment.progress}%</strong>
          </div>
          <ProgressBar value={enrollment.progress} />
        </div>
      </div>

      {error && <p className="instructor-message">{error}</p>}

      {lessons.length === 0 ? (
        <p className="course-status">The instructor has not added any lessons yet. Check back soon!</p>
      ) : (
        <div className="learn-layout">
          <ol className="lesson-list">
            {lessons.map((lesson, index) => (
              <li key={lesson._id} className={lesson._id === selectedId ? "active" : ""}>
                <button type="button" className="lesson-pick" onClick={() => setSelectedId(lesson._id)}>
                  <span className={completed.has(lesson._id) ? "check done" : "check"}>
                    {completed.has(lesson._id) ? "✓" : index + 1}
                  </span>
                  <span className="lesson-name">{lesson.title}</span>
                  {lesson.duration > 0 && <small>{lesson.duration}m</small>}
                </button>
              </li>
            ))}
          </ol>

          {selected && (
            <div className="lesson-view">
              <h3>{selected.title}</h3>

              {embedUrl && (
                <div className="video-frame">
                  <iframe
                    src={embedUrl}
                    title={selected.title}
                    allow="accelerometer; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {selected.videoUrl && !embedUrl && (
                <p>
                  <a className="video-link" href={selected.videoUrl} target="_blank" rel="noreferrer">
                    ▶ Open lesson video
                  </a>
                </p>
              )}

              {selected.content ? (
                <div className="lesson-text">{selected.content}</div>
              ) : (
                !selected.videoUrl && <p className="dashboard-note">No written content for this lesson.</p>
              )}

              <div className="lesson-actions">
                <button
                  className={completed.has(selected._id) ? "login-btn" : "signup-btn"}
                  onClick={() => toggleLesson(selected._id)}
                  disabled={busy}
                >
                  {completed.has(selected._id) ? "Mark as not done" : "Mark as complete ✓"}
                </button>

                {nextLesson && (
                  <button className="login-btn" onClick={() => setSelectedId(nextLesson._id)}>
                    Next lesson →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <form className="rate-card" onSubmit={submitRating}>
        <h3>Rate this course</h3>
        <p className="dashboard-note">
          Current rating:{" "}
          {course.ratingCount ? `${course.averageRating} from ${course.ratingCount} learner${course.ratingCount > 1 ? "s" : ""}` : "no ratings yet"}
        </p>

        <StarRating value={rating} onChange={setRating} />

        <textarea
          placeholder="Write a short review (optional)"
          maxLength={500}
          rows={3}
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />

        <button type="submit" className="signup-btn">
          {enrollment.rating ? "Update rating" : "Submit rating"}
        </button>

        {ratingMessage && <p className="instructor-message">{ratingMessage}</p>}
      </form>
    </section>
  );
}

export default Learn;
