function CityCard({
  city,
  temperature,
  weatherCode,
  loading,
  error,
  stale = false,
  unit = "C",
  onSelect,
  onRemove,
  selected = false,
}) {
  const getWeatherInfo = (code) => {
    if (code === 0) {
      return {
        text: "Clear",
        emoji: "☀️",
      };
    }

    if (code >= 1 && code <= 3) {
      return {
        text: "Cloudy",
        emoji: "☁️",
      };
    }

    if (code >= 45 && code <= 48) {
      return {
        text: "Foggy",
        emoji: "🌫️",
      };
    }

    if (code >= 51 && code <= 67) {
      return {
        text: "Rainy",
        emoji: "🌧️",
      };
    }

    if (code >= 71 && code <= 77) {
      return {
        text: "Snowy",
        emoji: "❄️",
      };
    }

    if (code >= 80 && code <= 82) {
      return {
        text: "Showers",
        emoji: "🌦️",
      };
    }

    if (code >= 85 && code <= 86) {
      return {
        text: "Snow Showers",
        emoji: "🌨️",
      };
    }

    if (code >= 95) {
      return {
        text: "Storm",
        emoji: "⛈️",
      };
    }

    return {
      text: "Unknown",
      emoji: "🌤️",
    };
  };

  const info = getWeatherInfo(weatherCode);

  /* ==============================
     TEMPERATURE CONVERSION
  ============================== */

  const displayTemperature =
    temperature === null ||
    temperature === undefined
      ? "--"
      : unit === "F"
        ? Math.round(
            (temperature * 9) / 5 + 32
          )
        : Math.round(temperature);

  return (
    <div
      className={`city-card ${
        selected ? "selected" : ""
      } ${loading ? "is-loading" : ""} ${
        error ? "has-error" : ""
      } ${stale ? "is-stale" : ""}`}
    >
      <button
        className="city-card-main"
        onClick={onSelect}
        type="button"
      >
        <div className="city-card-header">
          <strong>{city}</strong>

          <span className="city-card-icon">
            {loading
              ? "⏳"
              : error
                ? "⚠️"
                : info.emoji}
          </span>
        </div>

        <div className="city-card-weather">

          {loading ? (
            <div className="city-card-status">
              <strong>
                Syncing...
              </strong>

              <span>
                Updating weather
              </span>
            </div>
          ) : error ? (
            <div className="city-card-status">
              <strong>
                Unable to load
              </strong>

              <span>
                Click to retry
              </span>
            </div>
          ) : (
            <>
              <strong>
                {displayTemperature}°{unit}
              </strong>

              <span>
                {info.text}
              </span>
            </>
          )}

        </div>

        {/* STALE CACHE INDICATOR */}

        {!loading &&
          !error &&
          stale && (
            <span className="city-card-stale">
              Cached
            </span>
          )}
      </button>

      <button
        className="city-card-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        type="button"
        aria-label={`Remove ${city}`}
      >
        ×
      </button>
    </div>
  );
}

export default CityCard;