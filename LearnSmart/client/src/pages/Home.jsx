import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import CourseCard from "../components/CourseCard";
import ProgressBar from "../components/ProgressBar";

function Landing() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    API.get("/courses", { params: { sort: "popular" } })
      .then((response) => setCourses(response.data.courses || []))
      .catch(() => setCourses([]));
  }, []);

  const categoryCount = new Set(courses.map((course) => course.category)).size;

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <p className="hero-tag">✨ Smart learning platform</p>
          <h1>
            Learn Smarter, <span>Grow Faster</span>
          </h1>
          <p>
            Discover courses matched to your interests, track your progress lesson by lesson,
            and build the skills you need for your future.
          </p>

          <div className="hero-buttons">
            <Link className="primary-btn" to="/courses">
              Explore Courses →
            </Link>
            <a className="secondary-btn" href="#features">
              Learn More
            </a>
          </div>

          <div className="hero-stats">
            <div>
              <h3>{courses.length}</h3>
              <p>Published Courses</p>
            </div>
            <div>
              <h3>{categoryCount}</h3>
              <p>Categories</p>
            </div>
            <div>
              <h3>24/7</h3>
              <p>Learn Anytime</p>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="book-icon">📚</div>
          <div className="floating-icon icon-one">🎯</div>
          <div className="floating-icon icon-two">💡</div>
        </div>
      </section>

      <section className="features-section" id="features">
        <div className="section-heading">
          <h2>Why Choose LearnSmart?</h2>
          <p>Everything you need to learn and grow in one place.</p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="course-icon">🎯</div>
            <h3>Personalized Recommendations</h3>
            <p>Tell us your interests and skills and we suggest the courses that fit you best.</p>
          </div>
          <div className="feature-card">
            <div className="course-icon">📈</div>
            <h3>Track Your Progress</h3>
            <p>Complete lessons one by one and watch your progress bar grow.</p>
          </div>
          <div className="feature-card">
            <div className="course-icon">⭐</div>
            <h3>Ratings and Reviews</h3>
            <p>Pick the right course using honest ratings from other learners.</p>
          </div>
        </div>
      </section>

      <section className="courses-section">
        <div className="section-heading">
          <h2>Popular Courses</h2>
          <p>Start with what other learners are enjoying right now.</p>
        </div>

        {courses.length === 0 ? (
          <p className="course-status">No published courses yet.</p>
        ) : (
          <div className="course-grid">
            {courses.slice(0, 6).map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function StudentHome({ user }) {
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    API.get("/enrollments/my-learning")
      .then((response) => setEnrollments(response.data.enrollments || []))
      .catch(() => setEnrollments([]));
  }, []);

  const inProgress = enrollments.filter((item) => item.progress < 100).slice(0, 3);

  return (
    <>
      <section className="features-section">
        <div className="section-heading">
          <h2>Welcome back, {user.name}!</h2>
          <p>Pick up where you left off or find something new to learn.</p>
        </div>

        {inProgress.length > 0 && (
          <div className="course-grid">
            {inProgress.map((item) => (
              <div className="course-card" key={item._id}>
                <span className="course-category">{item.course.category}</span>
                <h3>{item.course.title}</h3>
                <div className="progress-label">
                  <span>Progress</span>
                  <strong>{item.progress}%</strong>
                </div>
                <ProgressBar value={item.progress} />
                <Link className="course-btn btn-link btn-spaced" to={`/learn/${item.course._id}`}>
                  Continue Learning →
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="feature-grid">
          <div className="feature-card">
            <div className="course-icon">📚</div>
            <h3>Browse Courses</h3>
            <p>Search and filter all published courses by category and level.</p>
            <Link className="course-btn btn-link btn-spaced" to="/courses">
              Browse →
            </Link>
          </div>
          <div className="feature-card">
            <div className="course-icon">🎓</div>
            <h3>My Learning</h3>
            <p>{enrollments.length ? `You are enrolled in ${enrollments.length} course${enrollments.length > 1 ? "s" : ""}.` : "You have not enrolled in any course yet."}</p>
            <Link className="course-btn btn-link btn-spaced" to="/my-learning">
              Open →
            </Link>
          </div>
          <div className="feature-card">
            <div className="course-icon">🎯</div>
            <h3>Recommended For You</h3>
            <p>Courses picked from your interests, skills and what is popular.</p>
            <Link className="course-btn btn-link btn-spaced" to="/recommendations">
              See picks →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Home() {
  const { user } = useAuth();

  // Instructors and admins work from their dashboards
  if (user?.role === "instructor") return <Navigate to="/instructor" replace />;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;

  return user ? <StudentHome user={user} /> : <Landing />;
}

export default Home;
