import { useEffect, useState } from "react";
import API, { errorMessage } from "../services/api";
import CourseCard from "../components/CourseCard";

const SORT_OPTIONS = [
  ["newest", "Newest"],
  ["popular", "Most popular"],
  ["rating", "Top rated"],
  ["price-low", "Price: low to high"],
  ["price-high", "Price: high to low"],
];

function Courses() {
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    level: "",
    sort: "newest",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const setFilter = (name, value) => setFilters((prev) => ({ ...prev, [name]: value }));

  // Wait until the user stops typing before searching
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    API.get("/courses/categories")
      .then((response) => setCategories(response.data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let ignore = false;

    API.get("/courses", {
      params: {
        search: debouncedSearch,
        category: filters.category,
        level: filters.level,
        sort: filters.sort,
      },
    })
      .then((response) => {
        if (ignore) return;
        setCourses(response.data.courses || []);
        setError("");
      })
      .catch((err) => {
        if (!ignore) setError(errorMessage(err, "Could not load courses."));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [debouncedSearch, filters.category, filters.level, filters.sort]);

  const hasFilters = filters.search || filters.category || filters.level;

  return (
    <section className="courses-section">
      <div className="section-heading">
        <h2>Available Courses</h2>
        <p>Find the right course for your goals.</p>
      </div>

      <div className="filters-bar">
        <input
          type="search"
          placeholder="Search by title, topic or skill..."
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
        />

        <select value={filters.category} onChange={(e) => setFilter("category", e.target.value)}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select value={filters.level} onChange={(e) => setFilter("level", e.target.value)}>
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <select value={filters.sort} onChange={(e) => setFilter("sort", e.target.value)}>
          {SORT_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            className="clear-filters"
            onClick={() => setFilters({ search: "", category: "", level: "", sort: filters.sort })}
          >
            Clear
          </button>
        )}
      </div>

      {loading && <p className="course-status">Loading courses...</p>}
      {error && <p className="course-status">{error}</p>}

      {!loading && !error && courses.length === 0 && (
        <p className="course-status">
          {hasFilters ? "No courses match your search." : "No published courses yet."}
        </p>
      )}

      {!loading && !error && courses.length > 0 && (
        <>
          <p className="result-count">
            {courses.length} course{courses.length > 1 ? "s" : ""} found
          </p>
          <div className="course-grid">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default Courses;
