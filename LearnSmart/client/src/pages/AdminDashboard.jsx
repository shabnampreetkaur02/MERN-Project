import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../components/CourseCard";

function AdminDashboard() {
  const { user } = useAuth();

  const [tab, setTab] = useState("users");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const [statsResponse, usersResponse, coursesResponse] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/admin/users"),
        API.get("/courses/all"),
      ]);

      setStats(statsResponse.data);
      setUsers(usersResponse.data.users || []);
      setCourses(coursesResponse.data.courses || []);
    } catch (error) {
      setMessage(errorMessage(error, "Could not load admin data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const changeRole = async (target, role) => {
    setMessage("");

    try {
      await API.patch(`/admin/users/${target._id}/role`, { role });
      setMessage(`${target.name} is now ${role === "admin" ? "an" : "a"} ${role}. They need to log in again to see the change.`);
      await loadAll();
    } catch (error) {
      setMessage(errorMessage(error, "Could not change the role."));
    }
  };

  const deleteUser = async (target) => {
    const warning =
      target.role === "instructor"
        ? `Delete ${target.name}? Their courses and the enrollments in them will be deleted too.`
        : `Delete ${target.name}? Their enrollments will be deleted too.`;

    if (!window.confirm(warning)) return;

    setMessage("");

    try {
      await API.delete(`/admin/users/${target._id}`);
      setMessage("User deleted.");
      await loadAll();
    } catch (error) {
      setMessage(errorMessage(error, "Could not delete the user."));
    }
  };

  const deleteCourse = async (course) => {
    if (!window.confirm(`Delete "${course.title}"? Enrolled students will lose access.`)) return;

    setMessage("");

    try {
      await API.delete(`/courses/${course._id}`);
      setMessage("Course deleted.");
      await loadAll();
    } catch (error) {
      setMessage(errorMessage(error, "Could not delete the course."));
    }
  };

  const toggleStatus = async (course) => {
    try {
      await API.put(`/courses/${course._id}`, {
        status: course.status === "published" ? "draft" : "published",
      });
      await loadAll();
    } catch (error) {
      setMessage(errorMessage(error, "Could not change the course status."));
    }
  };

  if (loading) return <p className="course-status">Loading admin dashboard...</p>;

  return (
    <section className="admin-dashboard">
      <div className="section-heading">
        <h2>Admin Dashboard</h2>
        <p>Manage users and courses.</p>
      </div>

      {stats && (
        <div className="admin-stats">
          <div className="admin-stat-card" onClick={() => setTab("users")}>
            <span>👥</span>
            <h3>{stats.users.total}</h3>
            <p>
              Users ({stats.users.students} students, {stats.users.instructors} instructors, {stats.users.admins} admins)
            </p>
          </div>
          <div className="admin-stat-card" onClick={() => setTab("courses")}>
            <span>📚</span>
            <h3>{stats.courses.total}</h3>
            <p>
              Courses ({stats.courses.published} published, {stats.courses.drafts} drafts)
            </p>
          </div>
          <div className="admin-stat-card static">
            <span>🎓</span>
            <h3>{stats.enrollments}</h3>
            <p>Enrollments</p>
          </div>
        </div>
      )}

      <div className="tabs">
        <button className={tab === "users" ? "tab active" : "tab"} onClick={() => setTab("users")}>
          Users
        </button>
        <button className={tab === "courses" ? "tab active" : "tab"} onClick={() => setTab("courses")}>
          Courses
        </button>
      </div>

      {message && <p className="instructor-message">{message}</p>}

      {tab === "users" && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => {
                const isSelf = item._id === user.id;

                return (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>
                      <select
                        value={item.role}
                        disabled={isSelf}
                        onChange={(e) => changeRole(item, e.target.value)}
                        title={isSelf ? "You cannot change your own role" : "Change role"}
                      >
                        <option value="student">student</option>
                        <option value="instructor">instructor</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="admin-delete-btn"
                        disabled={isSelf}
                        onClick={() => deleteUser(item)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "courses" && (
        <div className="admin-course-list">
          {courses.length === 0 && <p className="dashboard-note">There are no courses yet.</p>}

          {courses.map((course) => (
            <div className="admin-course-item" key={course._id}>
              <div>
                <h3>
                  <Link to={`/courses/${course._id}`}>{course.title}</Link>{" "}
                  <span className={`badge badge-${course.status}`}>{course.status}</span>
                </h3>
                <p>
                  {course.category} · {course.level} · {formatPrice(course.price)} · by{" "}
                  {course.instructor?.name || "unknown"} · {course.enrolledCount} enrolled
                </p>
              </div>

              <div className="row-actions">
                <button className="login-btn" onClick={() => toggleStatus(course)}>
                  {course.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <button className="admin-delete-btn" onClick={() => deleteCourse(course)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminDashboard;
