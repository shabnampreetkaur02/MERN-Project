import { useEffect, useState } from "react";
import API, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

const toText = (list) => (list || []).join(", ");

function Profile() {
  const { user, updateUser } = useAuth();
  const isStudent = user.role === "student";

  const [form, setForm] = useState({
    name: user.name || "",
    interests: toText(user.interests),
    skills: toText(user.skills),
    preferredLevel: user.learningPreferences?.preferredLevel || "beginner",
    preferredCategories: toText(user.learningPreferences?.preferredCategories),
  });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Load the latest saved profile (the stored login data may be older)
  useEffect(() => {
    API.get("/users/me")
      .then((response) => {
        const me = response.data.user;

        setForm({
          name: me.name || "",
          interests: toText(me.interests),
          skills: toText(me.skills),
          preferredLevel: me.learningPreferences?.preferredLevel || "beginner",
          preferredCategories: toText(me.learningPreferences?.preferredCategories),
        });
      })
      .catch(() => {});
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage("");
    setSaving(true);

    try {
      const payload = { name: form.name };

      if (isStudent) {
        payload.interests = form.interests;
        payload.skills = form.skills;
        payload.learningPreferences = {
          preferredLevel: form.preferredLevel,
          preferredCategories: form.preferredCategories,
        };
      }

      const response = await API.put("/users/me", payload);
      updateUser({ ...user, ...response.data.user });
      setProfileMessage("Profile saved.");
    } catch (err) {
      setProfileMessage(errorMessage(err, "Could not save your profile."));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage("");

    try {
      await API.put("/users/me/password", passwords);
      setPasswords({ currentPassword: "", newPassword: "" });
      setPasswordMessage("Password changed.");
    } catch (err) {
      setPasswordMessage(errorMessage(err, "Could not change your password."));
    }
  };

  return (
    <>
      <div className="instructor-form-card">
        <h2>My Profile</h2>
        <p>
          {user.email} · {user.role}
        </p>

        <form className="instructor-form" onSubmit={handleProfileSubmit}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          {isStudent && (
            <>
              <label htmlFor="interests">Interests (separate with commas)</label>
              <input
                id="interests"
                placeholder="web development, machine learning"
                value={form.interests}
                onChange={(e) => setForm({ ...form, interests: e.target.value })}
              />

              <label htmlFor="skills">Skills you already have</label>
              <input
                id="skills"
                placeholder="html, css, python"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
              />

              <label htmlFor="level">Preferred level</label>
              <select
                id="level"
                value={form.preferredLevel}
                onChange={(e) => setForm({ ...form, preferredLevel: e.target.value })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              <label htmlFor="categories">Preferred categories</label>
              <input
                id="categories"
                placeholder="Web Development, Data Science"
                value={form.preferredCategories}
                onChange={(e) => setForm({ ...form, preferredCategories: e.target.value })}
              />
            </>
          )}

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        {profileMessage && <p className="instructor-message">{profileMessage}</p>}
      </div>

      <div className="instructor-form-card">
        <h2>Change Password</h2>

        <form className="instructor-form" onSubmit={handlePasswordSubmit}>
          <label htmlFor="current">Current password</label>
          <input
            id="current"
            type="password"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            required
          />

          <label htmlFor="new">New password (minimum 8 characters)</label>
          <input
            id="new"
            type="password"
            minLength={8}
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            required
          />

          <button type="submit">Change Password</button>
        </form>

        {passwordMessage && <p className="instructor-message">{passwordMessage}</p>}
      </div>
    </>
  );
}

export default Profile;
