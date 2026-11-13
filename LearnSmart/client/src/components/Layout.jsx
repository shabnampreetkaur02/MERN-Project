import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LINKS = {
  guest: [
    ["/", "Home"],
    ["/courses", "Courses"],
  ],
  student: [
    ["/", "Home"],
    ["/courses", "Courses"],
    ["/my-learning", "My Learning"],
    ["/recommendations", "For You"],
    ["/profile", "Profile"],
  ],
  instructor: [
    ["/instructor", "Dashboard"],
    ["/courses", "Browse"],
    ["/profile", "Profile"],
  ],
  admin: [
    ["/admin", "Dashboard"],
    ["/courses", "Browse"],
    ["/profile", "Profile"],
  ],
};

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = LINKS[user ? user.role : "guest"] || LINKS.guest;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="app">
      <nav className="navbar">
        <Link className="logo" to="/">
          Learn<span>Smart.</span>
        </Link>

        <div className="nav-links">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <span>{user.name}</span>
              <button className="signup-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="login-btn" to="/login">
                Login
              </Link>
              <Link className="signup-btn" to="/register">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer>
        <Link className="logo" to="/">
          Learn<span>Smart.</span>
        </Link>
        <p>Learn today. Lead tomorrow.</p>
        <small>© 2026 LearnSmart. All rights reserved.</small>
      </footer>
    </div>
  );
}

export default Layout;
