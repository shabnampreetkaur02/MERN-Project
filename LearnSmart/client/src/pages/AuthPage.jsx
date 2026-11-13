import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import API, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

const HOME_BY_ROLE = {
  student: "/",
  instructor: "/instructor",
  admin: "/admin",
};

function AuthPage({ mode }) {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isLogin = mode === "login";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    interests: "",
    skills: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in? Go to the right home page.
  if (user) {
    return <Navigate to={HOME_BY_ROLE[user.role] || "/"} replace />;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : form;

      const response = await API.post(
        isLogin ? "/auth/login" : "/auth/register",
        payload
      );

      const loggedInUser = response.data.user;
      login(loggedInUser, response.data.token);

      const destination =
        loggedInUser.role === "student" && location.state?.from
          ? location.state.from
          : HOME_BY_ROLE[loggedInUser.role] || "/";

      navigate(destination, { replace: true });
    } catch (error) {
      setMessage(errorMessage(error, "Something went wrong. Try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>
          Learn<span>Smart.</span>
        </h1>

        <h2>{isLogin ? "Welcome Back!" : "Create Account"}</h2>
        <p>
          {isLogin
            ? "Login to continue your learning journey."
            : "Join LearnSmart and start learning today."}
        </p>

        {!isLogin && (
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />
        )}

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password (minimum 8 characters)"
          value={form.password}
          onChange={handleChange}
          minLength={8}
          required
        />

        {!isLogin && (
          <>
            <input
              type="text"
              name="interests"
              placeholder="Interests, e.g. web development, AI (optional)"
              value={form.interests}
              onChange={handleChange}
            />
            <input
              type="text"
              name="skills"
              placeholder="Skills you already have, e.g. html, python (optional)"
              value={form.skills}
              onChange={handleChange}
            />
            <small className="auth-hint">
              We use these to recommend courses for you. You can change them later in your profile.
            </small>
          </>
        )}

        {message && <div className="auth-message">{message}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
        </button>

        <div className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <Link to={isLogin ? "/register" : "/login"} state={location.state}>
            {isLogin ? " Sign Up" : " Login"}
          </Link>
        </div>

        <Link className="auth-back" to="/">
          ← Back to home
        </Link>
      </form>
    </div>
  );
}

export default AuthPage;
