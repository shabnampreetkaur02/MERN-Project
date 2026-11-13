// Read-only stars when `onChange` is not given, clickable stars when it is
function StarRating({ value = 0, onChange }) {
  return (
    <span className="stars" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);

        return onChange ? (
          <button
            type="button"
            key={star}
            className={filled ? "star filled" : "star"}
            onClick={() => onChange(star)}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            ★
          </button>
        ) : (
          <span key={star} className={filled ? "star filled" : "star"}>
            ★
          </span>
        );
      })}
    </span>
  );
}

export default StarRating;
