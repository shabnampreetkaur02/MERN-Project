import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import API, { errorMessage } from "../services/api";
import StarRating from "../components/StarRating";
import { formatPrice } from "../components/CourseCard";

const EMPTY_LESSON = { title: "", content: "", videoUrl: "", duration: "" };

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "",
  level: "beginner",
  duration: "",
  price: "",
  status: "draft",
  skills: "",
  tags: "",
  lessons: [],
};

function InstructorDashboard() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  const loadCourses = useCallback(async () => {
    try {
      const response = await API.get("/courses/mine");
      setCourses(response.data.courses || []);
    } catch (error) {
      setMessage(errorMessage(error, "Could not load your courses."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const setLesson = (index, name, value) =>
    setForm((prev) => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) => (i === index ? { ...lesson, [name]: value } : lesson)),
    }));

  const addLesson = () => setForm((prev) => ({ ...prev, lessons: [...prev.lessons, { ...EMPTY_LESSON }] }));

  const removeLesson = (index) =>
    setForm((prev) => ({ ...prev, lessons: prev.lessons.filter((_, i) => i !== index) }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (course) => {
    setEditingId(course._id);
    setMessage("");
    setForm({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      duration: course.duration || "",
      price: course.price || "",
      status: course.status,
      skills: (course.skills || []).join(", "),
      tags: (course.tags || []).join(", "),
      lessons: (course.lessons || []).map((lesson) => ({
        _id: lesson._id,
        title: lesson.title,
        content: lesson.content || "",
        videoUrl: lesson.videoUrl || "",
        duration: lesson.duration || "",
      })),
    });
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    const payload = {
      ...form,
      duration: Number(form.duration) || 0,
      price: Number(form.price) || 0,
      lessons: form.lessons.filter((lesson) => lesson.title.trim()),
    };

    try {
      if (editingId) {
        await API.put(`/courses/${editingId}`, payload);
        setMessage("Course updated successfully.");
      } else {
        await API.post("/courses", payload);
        setMessage("Course created successfully.");
      }

      resetForm();
      await loadCourses();
    } catch (error) {
      setMessage(errorMessage(error, "Could not save the course."));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (course) => {
    const status = course.status === "published" ? "draft" : "published";

    try {
      await API.put(`/courses/${course._id}`, { status });
      await loadCourses();
    } catch (error) {
      setMessage(errorMessage(error, "Could not change the course status."));
    }
  };

  const handleDelete = async (course) => {
    if (!window.confirm(`Delete "${course.title}"? Students enrolled in it will lose access.`)) return;

    try {
      await API.delete(`/courses/${course._id}`);
      if (editingId === course._id) resetForm();
      await loadCourses();
      setMessage("Course deleted.");
    } catch (error) {
      setMessage(errorMessage(error, "Could not delete the course."));
    }
  };

  return (
    <>
      <div className="instructor-form-card" ref={formRef}>
        <h2>{editingId ? "Edit Course" : "Create a New Course"}</h2>
        <p>Add the course details and its lessons. Keep it as a draft until you are ready to publish.</p>

        <form className="instructor-form" onSubmit={handleSubmit}>
          <label htmlFor="title">Title</label>
          <input id="title" value={form.title} onChange={(e) => setField("title", e.target.value)} required />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            required
          />

          <div className="form-row">
            <div>
              <label htmlFor="category">Category</label>
              <input
                id="category"
                placeholder="Web Development"
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="level">Level</label>
              <select id="level" value={form.level} onChange={(e) => setField("level", e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div>
              <label htmlFor="duration">Duration (weeks)</label>
              <input
                id="duration"
                type="number"
                min="0"
                value={form.duration}
                onChange={(e) => setField("duration", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="price">Price (₹, 0 for free)</label>
              <input
                id="price"
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="status">Status</label>
              <select id="status" value={form.status} onChange={(e) => setField("status", e.target.value)}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <label htmlFor="skills">Skills taught (separate with commas)</label>
          <input
            id="skills"
            placeholder="react, node, mongodb"
            value={form.skills}
            onChange={(e) => setField("skills", e.target.value)}
          />

          <label htmlFor="tags">Tags (separate with commas)</label>
          <input
            id="tags"
            placeholder="frontend, javascript"
            value={form.tags}
            onChange={(e) => setField("tags", e.target.value)}
          />

          <label>Lessons</label>

          {form.lessons.length === 0 && (
            <p className="dashboard-note">No lessons yet. Students see lessons after they enroll.</p>
          )}

          {form.lessons.map((lesson, index) => (
            <div className="lesson-editor" key={lesson._id || index}>
              <div className="lesson-editor-top">
                <strong>Lesson {index + 1}</strong>
                <button type="button" className="lesson-remove" onClick={() => removeLesson(index)}>
                  Remove
                </button>
              </div>

              <input
                placeholder="Lesson title"
                value={lesson.title}
                onChange={(e) => setLesson(index, "title", e.target.value)}
              />

              <div className="form-row">
                <input
                  placeholder="Video link (YouTube or any URL)"
                  value={lesson.videoUrl}
                  onChange={(e) => setLesson(index, "videoUrl", e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Minutes"
                  value={lesson.duration}
                  onChange={(e) => setLesson(index, "duration", e.target.value)}
                />
              </div>

              <textarea
                rows={3}
                placeholder="Lesson notes / content"
                value={lesson.content}
                onChange={(e) => setLesson(index, "content", e.target.value)}
              />
            </div>
          ))}

          <button type="button" className="lesson-add" onClick={addLesson}>
            + Add lesson
          </button>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save Changes" : "Create Course"}
          </button>

          {editingId && (
            <button type="button" className="lesson-add" onClick={resetForm}>
              Cancel editing
            </button>
          )}
        </form>

        {message && <p className="instructor-message">{message}</p>}
      </div>

      <section className="admin-section instructor-courses">
        <h2>My Courses</h2>

        {loading && <p className="course-status">Loading your courses...</p>}

        {!loading && courses.length === 0 && (
          <p className="dashboard-note">You have not created any course yet.</p>
        )}

        <div className="admin-course-list">
          {courses.map((course) => (
            <div className="admin-course-item" key={course._id}>
              <div>
                <h3>
                  <Link to={`/courses/${course._id}`}>{course.title}</Link>{" "}
                  <span className={`badge badge-${course.status}`}>{course.status}</span>
                </h3>
                <p>
                  {course.category} · {course.level} · {formatPrice(course.price)} ·{" "}
                  {course.lessons?.length || 0} lessons · {course.enrolledCount} enrolled
                </p>
                <p>
                  <StarRating value={course.averageRating} />{" "}
                  {course.ratingCount ? `${course.averageRating} (${course.ratingCount})` : "No ratings yet"}
                </p>
              </div>

              <div className="row-actions">
                <button className="login-btn" onClick={() => startEdit(course)}>
                  Edit
                </button>
                <button className="login-btn" onClick={() => toggleStatus(course)}>
                  {course.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <button className="admin-delete-btn" onClick={() => handleDelete(course)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default InstructorDashboard;
