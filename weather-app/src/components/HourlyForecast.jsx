function HourlyForecast({ hourly = [], unit = "C" }) {
  if (!Array.isArray(hourly) || hourly.length === 0) {
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

    if (unit === "F") {
      return Math.round(speed * 0.621371);
    }

    return Math.round(speed);
  }

  function formatTime(value) {
    if (!value) return "--";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "--";
    }

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function getHourLabel(value, index) {
    if (index === 0) {
      return "NOW";
    }

    return formatTime(value);
  }

  function getRainValue(value) {
    const rain = Number(value);

    if (!Number.isFinite(rain)) {
      return "--";
    }

    return `${Math.round(rain)}%`;
  }

  function getHumidityValue(value) {
    const humidity = Number(value);

    if (!Number.isFinite(humidity)) {
      return "--";
    }

    return `${Math.round(humidity)}%`;
  }

  function getWindDirection(degrees) {
    const value = Number(degrees);

    if (!Number.isFinite(value)) {
      return "--";
    }

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

    return directions[Math.round(value / 45) % 8];
  }

  const temperatureUnit = unit === "F" ? "°F" : "°C";
  const windUnit = unit === "F" ? "mph" : "km/h";

  return (
    <section className="hourly-forecast">
      <div className="hourly-forecast-header">
        <div>
          <h3>Next 24 Hours</h3>

          <p>
            Hourly temperature, rain chance, humidity and wind
          </p>
        </div>
      </div>

      <div className="hourly-list">
        {hourly.slice(0, 24).map((item, index) => {
          const weatherInfo = getWeatherInfo(
            item.weatherCode
          );

          const temperature = convertTemperature(
            item.temperature
          );

          const rainProbability =
            item.rainProbability ??
            item.precipitationProbability ??
            item.precipitation_probability;

          const humidity =
            item.humidity ??
            item.relativeHumidity ??
            item.relative_humidity_2m;

          const windSpeed =
            item.windSpeed ??
            item.wind_speed_10m;

          const windDirection =
            item.windDirection ??
            item.wind_direction_10m;

          const isCurrent =
            index === 0 ||
            item.isCurrent === true ||
            item.current === true;

          return (
            <article
              key={`${item.time || "hour"}-${index}`}
              className={`hourly-item ${
                isCurrent ? "is-current" : ""
              }`}
            >
              {/* Time */}
              <div className="hourly-time">
                <strong>
                  {getHourLabel(item.time, index)}
                </strong>

                {index !== 0 && (
                  <span>Hourly</span>
                )}
              </div>

              {/* Weather icon */}
              <div
                className="hourly-weather-icon"
                title={weatherInfo.text}
                aria-label={weatherInfo.text}
              >
                {weatherInfo.emoji}
              </div>

              {/* Temperature */}
              <div className="hourly-temperature">
                {temperature}
                {temperatureUnit}
              </div>

              {/* Condition */}
              <div
                className="hourly-condition"
                title={weatherInfo.text}
              >
                {weatherInfo.text}
              </div>

              {/* Rain */}
              <div className="hourly-rain">
                💧 Rain {getRainValue(rainProbability)}
              </div>

              {/* Details */}
              <div className="hourly-details">
                <div className="hourly-detail">
                  <span>Humidity</span>

                  <strong>
                    {getHumidityValue(humidity)}
                  </strong>
                </div>

                <div className="hourly-detail">
                  <span>Wind</span>

                  <strong>
                    {convertWind(windSpeed)} {windUnit}
                  </strong>
                </div>

                <div className="hourly-wind">
                  💨 {getWindDirection(windDirection)}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default HourlyForecast;