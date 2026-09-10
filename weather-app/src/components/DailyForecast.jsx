function DailyForecast({ forecast = [], daily = [], unit = "C" }) {
  // Supports both:
  // <DailyForecast forecast={...} />
  // <DailyForecast daily={...} />
  const days =
    Array.isArray(forecast) && forecast.length > 0
      ? forecast
      : Array.isArray(daily)
        ? daily
        : [];

  if (days.length === 0) {
    return null;
  }

  function getWeatherInfo(code) {
    if (code === 0) return { text: "Clear Sky", emoji: "☀️" };
    if (code === 1) return { text: "Mainly Clear", emoji: "🌤️" };
    if (code === 2) return { text: "Partly Cloudy", emoji: "⛅" };
    if (code === 3) return { text: "Overcast", emoji: "☁️" };

    if ([45, 48].includes(code)) {
      return { text: "Foggy", emoji: "🌫️" };
    }

    if ([51, 53, 55, 56, 57].includes(code)) {
      return { text: "Drizzle", emoji: "🌦️" };
    }

    if ([61, 63, 65, 66, 67].includes(code)) {
      return { text: "Rain", emoji: "🌧️" };
    }

    if ([71, 73, 75, 77].includes(code)) {
      return { text: "Snow", emoji: "❄️" };
    }

    if ([80, 81, 82].includes(code)) {
      return { text: "Rain Showers", emoji: "🌦️" };
    }

    if ([85, 86].includes(code)) {
      return { text: "Snow Showers", emoji: "🌨️" };
    }

    if ([95, 96, 99].includes(code)) {
      return { text: "Thunderstorm", emoji: "⛈️" };
    }

    return { text: "Unknown", emoji: "🌤️" };
  }

  function getRainLabel(value) {
    const rain = Number(value);

    if (!Number.isFinite(rain)) return "Rain --";

    if (rain >= 70) return `${Math.round(rain)}% High`;
    if (rain >= 40) return `${Math.round(rain)}% Moderate`;

    return `${Math.round(rain)}% Low`;
  }

  function getUvLabel(value) {
    const uv = Number(value);

    if (!Number.isFinite(uv)) return "UV --";

    if (uv >= 11) return `${uv.toFixed(1)} Extreme`;
    if (uv >= 8) return `${uv.toFixed(1)} Very High`;
    if (uv >= 6) return `${uv.toFixed(1)} High`;
    if (uv >= 3) return `${uv.toFixed(1)} Moderate`;

    return `${uv.toFixed(1)} Low`;
  }

  function getWindDirection(degrees) {
    const value = Number(degrees);

    if (!Number.isFinite(value)) return "--";

    const directions = [
      "N",
      "NE",
      "E",
      "SE",
      "S",
      "SW",
      "W",
      "NW",
    ];

    const index = Math.round(value / 45) % 8;

    return directions[index];
  }

  function formatDay(dateString) {
    if (!dateString) return "--";

    const date = new Date(`${dateString}T12:00:00`);

    if (Number.isNaN(date.getTime())) return "--";

    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
    }).format(date);
  }

  function formatDate(dateString) {
    if (!dateString) return "--";

    const date = new Date(`${dateString}T12:00:00`);

    if (Number.isNaN(date.getTime())) return "--";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  }

  function formatTime(value) {
    if (!value) return "--";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "--";

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function convertTemperature(value) {
    const temperature = Number(value);

    if (!Number.isFinite(temperature)) {
      return "--";
    }

    if (unit === "F") {
      return Math.round((temperature * 9) / 5 + 32);
    }

    return Math.round(temperature);
  }

  function convertWind(value) {
    const speed = Number(value);

    if (!Number.isFinite(speed)) {
      return "--";
    }

    // Open-Meteo wind speed is km/h.
    // Convert to mph when Fahrenheit mode is selected.
    if (unit === "F") {
      return Math.round(speed * 0.621371);
    }

    return Math.round(speed);
  }

  const temperatureUnit = unit === "F" ? "°F" : "°C";
  const windUnit = unit === "F" ? "mph" : "km/h";

  return (
    <section className="daily-forecast">
      <div className="daily-forecast-header">
        <div>
          <span className="daily-forecast-kicker">
            EXTENDED OUTLOOK
          </span>

          <h2>7-Day Forecast</h2>

          <p>
            Daily weather conditions, temperature, rain chance,
            UV, wind and sunlight.
          </p>
        </div>

        <div className="daily-forecast-icon" aria-hidden="true">
          📅
        </div>
      </div>

      <div className="daily-list">
        {days.map((item, index) => {
          const weatherInfo = getWeatherInfo(item.weatherCode);

          const isToday =
            index === 0 ||
            item.isToday === true ||
            item.today === true;

          const maxTemperature = convertTemperature(
            item.temperatureMax
          );

          const minTemperature = convertTemperature(
            item.temperatureMin
          );

          const wind = convertWind(item.windSpeed);

          const windDirection = getWindDirection(
            item.windDirection
          );

          const rainProbability =
            item.rainProbability ??
            item.precipitationProbability ??
            item.precipitation_probability;

          const uvIndex =
            item.uvIndex ??
            item.uvIndexMax ??
            item.uv_index_max;

          return (
            <article
              key={`${item.date || "day"}-${index}`}
              className={`daily-item ${
                isToday ? "is-today" : ""
              }`}
            >
              {/* Day */}
              <div className="daily-day">
                <strong>
                  {isToday ? "Today" : formatDay(item.date)}
                </strong>

                <span>
                  {formatDate(item.date)}
                </span>

                {isToday && (
                  <span className="daily-today-badge">
                    TODAY
                  </span>
                )}
              </div>

              {/* Main weather */}
              <div className="daily-condition">
                <div
                  className="daily-weather-icon"
                  title={weatherInfo.text}
                  aria-label={weatherInfo.text}
                >
                  {weatherInfo.emoji}
                </div>

                <div>
                  <strong>{weatherInfo.text}</strong>

                  <span>
                    {item.weatherDescription ||
                      weatherInfo.text}
                  </span>
                </div>
              </div>

              {/* Temperature */}
              <div className="daily-temperature">
                <strong>
                  {maxTemperature}
                  {temperatureUnit}
                </strong>

                <span>
                  {minTemperature}
                  {temperatureUnit}
                </span>
              </div>

              {/* Extra information */}
              <div className="daily-extra">
                <div
                  className="daily-extra-item"
                  title="Rain probability"
                >
                  <span className="daily-extra-icon">
                    💧
                  </span>

                  <div>
                    <strong>
                      {getRainLabel(rainProbability)}
                    </strong>

                    <span>Rain chance</span>
                  </div>
                </div>

                <div
                  className="daily-extra-item"
                  title="UV index"
                >
                  <span className="daily-extra-icon">
                    ☀️
                  </span>

                  <div>
                    <strong>
                      {getUvLabel(uvIndex)}
                    </strong>

                    <span>UV Index</span>
                  </div>
                </div>

                <div
                  className="daily-extra-item"
                  title="Wind speed and direction"
                >
                  <span className="daily-extra-icon">
                    💨
                  </span>

                  <div>
                    <strong>
                      {wind} {windUnit}
                    </strong>

                    <span>
                      Wind {windDirection}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sunrise / Sunset */}
              <div className="daily-sun">
                <div>
                  <span>🌅</span>

                  <div>
                    <strong>
                      {formatTime(item.sunrise)}
                    </strong>

                    <span>Sunrise</span>
                  </div>
                </div>

                <div>
                  <span>🌇</span>

                  <div>
                    <strong>
                      {formatTime(item.sunset)}
                    </strong>

                    <span>Sunset</span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default DailyForecast;