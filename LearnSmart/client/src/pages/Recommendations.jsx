import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API, { errorMessage } from "../services/api";
import CourseCard from "../components/CourseCard";

function Recommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/recommendations")
      .then((response) => setData(response.data))
      .catch((err) => setError(errorMessage(err, "Could not load recommendations.")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="courses-section">
      <div className="section-heading">
        <h2>Recommended For You</h2>
        <p>Courses ranked by how well they match your interests, plus what is popular.</p>
      </div>

      {loading && <p className="course-status">Finding the best courses for you...</p>}
      {error && <p className="course-status">{error}</p>}

      {data && !data.hasInterests && (
        <p className="notice">
          You have not added any interests or skills yet, so these picks are based on popularity only.{" "}
          <Link to="/profile">Add your interests</Link> to get personalized results.
        </p>
      )}

      {data && data.recommendations.length === 0 && (
        <p className="course-status">
          Nothing to recommend right now. <Link to="/courses">Browse all courses</Link>
        </p>
      )}

      {data && data.recommendations.length > 0 && (
        <div className="course-grid">
          {data.recommendations.map((item) => (
            <CourseCard key={item.course._id} course={item.course} icon="🎯">
              {item.matchedInterests.length > 0 && (
                <div className="chip-row">
                  {item.matchedInterests.map((interest) => (
                    <span className="chip" key={interest}>
                      ✓ {interest}
                    </span>
                  ))}
                </div>
              )}
              <p className="recommendation-score">Match score: {item.finalScore}</p>
            </CourseCard>
          ))}
        </div>
      )}
    </section>
  );
}

export default Recommendations;
