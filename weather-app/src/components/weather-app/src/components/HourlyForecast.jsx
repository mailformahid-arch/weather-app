import { formatHour, formatTemperature, getWeatherInfo } from "../utils/weatherUtils";

function HourlyForecast({ hourly, unit = "C" }) {
  if (!hourly || hourly.length === 0) {
    return null;
  }

  return (
    <section className="hourly-section">
      <div className="section-header">
        <h2>Next 24 Hours</h2>
      </div>

      <div className="hourly-scroll">
        {hourly.slice(0, 24).map((item, index) => {
          const info = getWeatherInfo(item.weatherCode);

          return (
            <div className="hourly-card" key={`${item.time}-${index}`}>
              <span className="hourly-time">
                {formatHour(item.time)}
              </span>

              <span className="hourly-icon">
                {info.emoji}
              </span>

              <strong className="hourly-temperature">
                {formatTemperature(item.temperature, unit)}°{unit}
              </strong>

              <span className="hourly-rain">
                💧 {item.rainProbability ?? 0}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default HourlyForecast;