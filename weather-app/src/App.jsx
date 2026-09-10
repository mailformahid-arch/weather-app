import { useEffect, useState } from "react";
import "./style.css";

function getWeatherInfo(code) {
  if (code === 0) return { text: "Clear Sky", emoji: "☀️" };
  if (code >= 1 && code <= 3) return { text: "Cloudy", emoji: "☁️" };
  if (code >= 51 && code <= 67) return { text: "Rainy", emoji: "🌧️" };
  if (code >= 71 && code <= 77) return { text: "Snowy", emoji: "❄️" };
  if (code >= 80 && code <= 82) return { text: "Rain Showers", emoji: "🌦️" };
  if (code >= 95) return { text: "Thunderstorm", emoji: "⛈️" };

  return { text: "Unknown", emoji: "🌤️" };
}

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [unit, setUnit] = useState("C");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recentCities")) || [];
    } catch {
      return [];
    }
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  const convertTemperature = (celsius) => {
    if (unit === "F") {
      return Math.round((celsius * 9) / 5 + 32);
    }

    return Math.round(celsius);
  };

  const saveRecentSearch = (cityName) => {
    const updated = [
      cityName,
      ...recentSearches.filter(
        (item) => item.toLowerCase() !== cityName.toLowerCase()
      ),
    ].slice(0, 5);

    setRecentSearches(updated);
    localStorage.setItem("recentCities", JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentCities");
  };

  // City suggestions
  useEffect(() => {
    const getSuggestions = async () => {
      if (city.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setSuggestionLoading(true);

        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            city
          )}&count=5&language=en&format=json`
        );

        const data = await response.json();

        setSuggestions(data.results || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionLoading(false);
      }
    };

    const timer = setTimeout(getSuggestions, 350);

    return () => clearTimeout(timer);
  }, [city]);

  const searchWeather = async (selectedCity = city) => {
    if (!selectedCity.trim()) {
      setError("Please enter a city name");
      setWeather(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuggestions([]);

      const locationResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          selectedCity
        )}&count=1&language=en&format=json`
      );

      if (!locationResponse.ok) {
        throw new Error("Location request failed");
      }

      const locationData = await locationResponse.json();

      if (!locationData.results?.length) {
        setError("City not found. Please try another city.");
        setWeather(null);
        return;
      }

      const location = locationData.results[0];

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,uv_index&hourly=temperature_2m,weather_code,precipitation_probability,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&forecast_days=5&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`
      );

      if (!weatherResponse.ok) {
        throw new Error("Weather request failed");
      }

      const weatherData = await weatherResponse.json();

      setWeather({
        city: location.name,
        country: location.country,
        temperature: weatherData.current.temperature_2m,
        feelsLike: weatherData.current.apparent_temperature,
        weatherCode: weatherData.current.weather_code,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        uvIndex: weatherData.current.uv_index,

        sunrise: weatherData.daily.sunrise[0],
        sunset: weatherData.daily.sunset[0],

        forecast: weatherData.daily.time.map((date, index) => ({
          date,
          weatherCode: weatherData.daily.weather_code[index],
          max: weatherData.daily.temperature_2m_max[index],
          min: weatherData.daily.temperature_2m_min[index],
          uv: weatherData.daily.uv_index_max[index],
          sunrise: weatherData.daily.sunrise[index],
          sunset: weatherData.daily.sunset[index],
        })),

        hourly: weatherData.hourly.time.slice(0, 12).map((time, index) => ({
          time,
          temperature: weatherData.hourly.temperature_2m[index],
          weatherCode: weatherData.hourly.weather_code[index],
          precipitation:
            weatherData.hourly.precipitation_probability[index],
          humidity: weatherData.hourly.relative_humidity_2m[index],
          wind: weatherData.hourly.wind_speed_10m[index],
        })),
      });

      setCity(location.name);
      saveRecentSearch(location.name);
      setLastUpdated(new Date());
    } catch {
      setError("Something went wrong. Please try again.");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      searchWeather();
    }

    if (e.key === "Escape") {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion) => {
    const name = suggestion.name;

    setCity(name);
    setSuggestions([]);
    searchWeather(name);
  };

  const selectRecentCity = (recentCity) => {
    setCity(recentCity);
    searchWeather(recentCity);
  };

  // Refresh current weather
  const refreshWeather = async () => {
    if (!weather?.city) return;

    setRefreshing(true);

    try {
      await searchWeather(weather.city);
    } finally {
      setRefreshing(false);
    }
  };

  // Current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,uv_index&hourly=temperature_2m,weather_code,precipitation_probability,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&forecast_days=5&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`
          );

          if (!response.ok) {
            throw new Error("Location weather request failed");
          }

          const data = await response.json();

          setWeather({
            city: "Your Location",
            country: "",

            temperature: data.current.temperature_2m,
            feelsLike: data.current.apparent_temperature,
            weatherCode: data.current.weather_code,
            humidity: data.current.relative_humidity_2m,
            windSpeed: data.current.wind_speed_10m,
            uvIndex: data.current.uv_index,

            sunrise: data.daily.sunrise[0],
            sunset: data.daily.sunset[0],

            forecast: data.daily.time.map((date, index) => ({
              date,
              weatherCode: data.daily.weather_code[index],
              max: data.daily.temperature_2m_max[index],
              min: data.daily.temperature_2m_min[index],
              uv: data.daily.uv_index_max[index],
              sunrise: data.daily.sunrise[index],
              sunset: data.daily.sunset[index],
            })),

            hourly: data.hourly.time.slice(0, 12).map((time, index) => ({
              time,
              temperature: data.hourly.temperature_2m[index],
              weatherCode: data.hourly.weather_code[index],
              precipitation:
                data.hourly.precipitation_probability[index],
              humidity: data.hourly.relative_humidity_2m[index],
              wind: data.hourly.wind_speed_10m[index],
            })),
          });

          setLastUpdated(new Date());
        } catch {
          setError("Unable to get weather for your location.");
          setWeather(null);
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setError("Location permission was denied.");
        setLocationLoading(false);
      }
    );
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return "--";

    return new Date(dateTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const weatherInfo = weather
    ? getWeatherInfo(weather.weatherCode)
    : null;

  const weatherType =
    weather?.weatherCode === 0
      ? "clear"
      : weather?.weatherCode >= 1 && weather?.weatherCode <= 3
      ? "cloudy"
      : weather?.weatherCode >= 51 && weather?.weatherCode <= 82
      ? "rainy"
      : weather?.weatherCode >= 71 && weather?.weatherCode <= 77
      ? "snowy"
      : weather?.weatherCode >= 95
      ? "storm"
      : "clear";

  return (
    <div
      className={`weather-app ${weatherType} ${
        darkMode ? "dark-mode" : ""
      }`}
    >
      <div className="weather-container">

        {/* HEADER */}
        <div className="header">
          <div className="header-top">
            <div>
              <h1>Weather App 🌤️</h1>
              <p>Check the current weather anywhere in the world</p>
            </div>

            <button
              className="theme-button"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="search-wrapper">
          <div className="search-box">
            <input
              type="text"
              placeholder="Enter city name..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />

            <button
              onClick={() => searchWeather()}
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((suggestion) => (
                <button
                  key={`${suggestion.id}-${suggestion.latitude}`}
                  className="suggestion-item"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  <span>📍</span>

                  <div>
                    <strong>{suggestion.name}</strong>

                    <small>
                      {suggestion.admin1
                        ? `${suggestion.admin1}, `
                        : ""}
                      {suggestion.country}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          )}

          {suggestionLoading && city.trim().length >= 2 && (
            <div className="suggestion-loading">
              Searching cities...
            </div>
          )}
        </div>

        {/* RECENT SEARCHES */}
        {recentSearches.length > 0 && (
          <div className="recent-section">
            <div className="recent-header">
              <h3>🕘 Recent Searches</h3>

              <button onClick={clearRecentSearches}>
                Clear
              </button>
            </div>

            <div className="recent-list">
              {recentSearches.map((recentCity) => (
                <button
                  className="recent-city"
                  key={recentCity}
                  onClick={() => selectRecentCity(recentCity)}
                >
                  📍 {recentCity}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CONTROLS */}
        <div className="action-buttons">
          <button
            className={unit === "C" ? "unit active" : "unit"}
            onClick={() => setUnit("C")}
          >
            °C
          </button>

          <button
            className={unit === "F" ? "unit active" : "unit"}
            onClick={() => setUnit("F")}
          >
            °F
          </button>

          <button
            className="location-button"
            onClick={getCurrentLocation}
            disabled={locationLoading}
          >
            {locationLoading
              ? "Getting Location..."
              : "📍 My Location"}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* WEATHER */}
        {weather && (
          <div className="weather-card">

            {/* LAST UPDATED + REFRESH */}
            <div className="weather-card-top">
              <span>
                Last updated:{" "}
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "--"}
              </span>

              <button
                className="refresh-button"
                onClick={refreshWeather}
                disabled={refreshing || loading}
              >
                {refreshing ? "↻ Updating..." : "↻ Refresh"}
              </button>
            </div>

            {/* LOCATION */}
            <div className="location">
              <h2>{weather.city}</h2>

              {weather.country && (
                <span>{weather.country}</span>
              )}
            </div>

            {/* WEATHER ICON */}
            <div className="weather-icon">
              {weatherInfo.emoji}
            </div>

            {/* TEMPERATURE */}
            <div className="temperature">
              {convertTemperature(weather.temperature)}
              <span>°{unit}</span>
            </div>

            <div className="condition">
              {weatherInfo.text}
            </div>

            {/* DETAILS */}
            <div className="weather-details">

              <div className="detail">
                <span className="detail-icon">💧</span>
                <div>
                  <small>Humidity</small>
                  <strong>{weather.humidity}%</strong>
                </div>
              </div>

              <div className="detail">
                <span className="detail-icon">💨</span>
                <div>
                  <small>Wind Speed</small>
                  <strong>{weather.windSpeed} km/h</strong>
                </div>
              </div>

              <div className="detail">
                <span className="detail-icon">🌡️</span>
                <div>
                  <small>Feels Like</small>
                  <strong>
                    {convertTemperature(weather.feelsLike)}°{unit}
                  </strong>
                </div>
              </div>

              <div className="detail">
                <span className="detail-icon">☀️</span>
                <div>
                  <small>UV Index</small>
                  <strong>{weather.uvIndex ?? "--"}</strong>
                </div>
              </div>

            </div>

            {/* SUNRISE / SUNSET */}
            <div className="sun-info">

              <div className="sun-box">
                <span>🌅</span>

                <div>
                  <small>Sunrise</small>
                  <strong>{formatTime(weather.sunrise)}</strong>
                </div>
              </div>

              <div className="sun-box">
                <span>🌇</span>

                <div>
                  <small>Sunset</small>
                  <strong>{formatTime(weather.sunset)}</strong>
                </div>
              </div>

            </div>

            {/* HOURLY */}
            <div className="hourly-section">
              <h3>Hourly Forecast</h3>

              <div className="hourly-list">
                {weather.hourly.map((hour) => {
                  const info = getWeatherInfo(hour.weatherCode);

                  return (
                    <div
                      className="hourly-item"
                      key={hour.time}
                    >
                      <strong>
                        {new Date(hour.time).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "numeric",
                          }
                        )}
                      </strong>

                      <span>{info.emoji}</span>

                      <b>
                        {convertTemperature(hour.temperature)}°
                      </b>

                      <small>
                        💧 {hour.precipitation}%
                      </small>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5 DAY FORECAST */}
            <div className="forecast">
              <h3>5-Day Forecast</h3>

              <div className="forecast-list">
                {weather.forecast.map((day, index) => {
                  const info = getWeatherInfo(day.weatherCode);

                  return (
                    <div
                      className="forecast-day"
                      key={day.date}
                    >
                      <strong>
                        {index === 0
                          ? "Today"
                          : new Date(day.date).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                              }
                            )}
                      </strong>

                      <span className="forecast-icon">
                        {info.emoji}
                      </span>

                      <span>
                        {convertTemperature(day.max)}° /{" "}
                        {convertTemperature(day.min)}°
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* WELCOME */}
        {!weather && !error && !loading && (
          <div className="welcome">
            <div className="welcome-icon">🌤️</div>

            <h2>Search for a city</h2>

            <p>
              Enter a city name above to see the current weather.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;