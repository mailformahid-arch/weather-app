import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import "./style.css";

import HourlyForecast from "./components/HourlyForecast";
import DailyForecast from "./components/DailyForecast";
import CitiesDashboard from "./components/CitiesDashboard";

const WEATHER_CACHE_DURATION = 10 * 60 * 1000;
const WEATHER_STALE_CACHE_DURATION = 24 * 60 * 60 * 1000;
const WEATHER_CACHE_PREFIX = "weatherCache_";
const MAX_SAVED_CITIES = 8;

function getWeatherInfo(code) {
  const value = Number(code);

  if (value === 0) {
    return { text: "Clear Sky", emoji: "☀️" };
  }

  if (value >= 1 && value <= 3) {
    return { text: "Partly Cloudy", emoji: "⛅" };
  }

  if (value >= 45 && value <= 48) {
    return { text: "Foggy", emoji: "🌫️" };
  }

  if (value >= 51 && value <= 57) {
    return { text: "Drizzle", emoji: "🌦️" };
  }

  if (value >= 61 && value <= 67) {
    return { text: "Rain", emoji: "🌧️" };
  }

  if (value >= 71 && value <= 77) {
    return { text: "Snow", emoji: "❄️" };
  }

  if (value >= 80 && value <= 82) {
    return { text: "Rain Showers", emoji: "🌦️" };
  }

  if (value >= 85 && value <= 86) {
    return { text: "Snow Showers", emoji: "🌨️" };
  }

  if (value >= 95 && value <= 99) {
    return { text: "Thunderstorm", emoji: "⛈️" };
  }

  return { text: "Unknown", emoji: "🌤️" };
}

function getWeatherType(code) {
  const value = Number(code);

  if (value === 0) return "clear";
  if (value >= 1 && value <= 3) return "cloudy";
  if (value >= 45 && value <= 48) return "fog";
  if (value >= 51 && value <= 67) return "rain";
  if (value >= 71 && value <= 77) return "snow";
  if (value >= 80 && value <= 82) return "showers";
  if (value >= 85 && value <= 86) return "snow-showers";
  if (value >= 95 && value <= 99) return "storm";

  return "unknown";
}

function getUvInfo(value) {
  const uv = Number(value);

  if (!Number.isFinite(uv)) {
    return {
      label: "Unavailable",
      level: "unknown",
    };
  }

  if (uv <= 2) return { label: "Low", level: "low" };
  if (uv <= 5) return { label: "Moderate", level: "moderate" };
  if (uv <= 7) return { label: "High", level: "high" };
  if (uv <= 10) return { label: "Very High", level: "very-high" };

  return { label: "Extreme", level: "extreme" };
}

function getHumidityInfo(value) {
  const humidity = Number(value);

  if (!Number.isFinite(humidity)) {
    return {
      label: "Unavailable",
      level: "unknown",
    };
  }

  if (humidity < 30) {
    return { label: "Dry", level: "dry" };
  }

  if (humidity <= 60) {
    return { label: "Comfortable", level: "comfortable" };
  }

  if (humidity <= 75) {
    return { label: "Humid", level: "humid" };
  }

  return {
    label: "Very Humid",
    level: "very-humid",
  };
}

function getRainInfo(value) {
  const rain = Number(value);

  if (!Number.isFinite(rain)) {
    return {
      label: "Unavailable",
      level: "unknown",
    };
  }

  if (rain < 20) {
    return { label: "Very Low", level: "very-low" };
  }

  if (rain < 40) {
    return { label: "Low", level: "low" };
  }

  if (rain < 70) {
    return { label: "Possible", level: "possible" };
  }

  return {
    label: "Likely",
    level: "likely",
  };
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

  return directions[Math.round(value / 45) % 8];
}

function getWeatherAlerts(weather) {
  if (!weather) return [];

  const alerts = [];

  const rain = Number(weather.rainProbability);
  const uv = Number(weather.uvIndex);
  const wind = Number(weather.windSpeed);
  const temperature = Number(weather.temperature);
  const code = Number(weather.weatherCode);

  if (code >= 95 && code <= 99) {
    alerts.push({
      type: "severe",
      icon: "⛈️",
      title: "Thunderstorm Alert",
      message:
        "Thunderstorms are currently possible. Stay alert for changing conditions.",
    });
  }

  if (Number.isFinite(rain) && rain >= 70) {
    alerts.push({
      type: "warning",
      icon: "🌧️",
      title: "Heavy Rain Possible",
      message: `There is a ${Math.round(
        rain
      )}% chance of rain. Consider carrying an umbrella.`,
    });
  }

  if (Number.isFinite(wind) && wind >= 40) {
    alerts.push({
      type: "warning",
      icon: "💨",
      title: "Strong Wind",
      message: `Wind speeds are around ${Math.round(
        wind
      )} km/h. Outdoor conditions may be uncomfortable.`,
    });
  }

  if (Number.isFinite(uv) && uv >= 8) {
    alerts.push({
      type: "warning",
      icon: "☀️",
      title: "Very High UV",
      message:
        "UV levels are very high. Limit prolonged sun exposure and consider sun protection.",
    });
  }

  if (Number.isFinite(temperature) && temperature >= 40) {
    alerts.push({
      type: "severe",
      icon: "🔥",
      title: "Extreme Heat",
      message:
        "Temperatures are extremely high. Stay hydrated and avoid prolonged outdoor activity.",
    });
  } else if (
    Number.isFinite(temperature) &&
    temperature >= 35
  ) {
    alerts.push({
      type: "warning",
      icon: "🌡️",
      title: "High Temperature",
      message:
        "High temperatures are expected. Stay hydrated and take breaks from direct heat.",
    });
  }

  if (
    (code >= 71 && code <= 77) ||
    (code >= 85 && code <= 86)
  ) {
    alerts.push({
      type: "warning",
      icon: "❄️",
      title: "Snow Conditions",
      message:
        "Snow is currently expected. Roads and outdoor surfaces may become slippery.",
    });
  }

  return alerts.slice(0, 4);
}

function createCacheKey(latitude, longitude) {
  return `${WEATHER_CACHE_PREFIX}${Number(latitude).toFixed(
    4
  )}_${Number(longitude).toFixed(4)}`;
}

function saveWeatherCache(latitude, longitude, data) {
  try {
    localStorage.setItem(
      createCacheKey(latitude, longitude),
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch (error) {
    console.warn("Unable to save weather cache:", error);
  }
}

function getWeatherCache(latitude, longitude) {
  try {
    const key = createCacheKey(latitude, longitude);
    const raw = localStorage.getItem(key);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed?.timestamp || !parsed?.data) {
      localStorage.removeItem(key);
      return null;
    }

    const age = Date.now() - parsed.timestamp;

    if (age > WEATHER_STALE_CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }

    return {
      data: parsed.data,
      timestamp: parsed.timestamp,
      isFresh: age < WEATHER_CACHE_DURATION,
    };
  } catch (error) {
    console.warn("Unable to read weather cache:", error);

    try {
      localStorage.removeItem(
        createCacheKey(latitude, longitude)
      );
    } catch {
      // Ignore cleanup errors.
    }

    return null;
  }
}

function clearExpiredWeatherCaches() {
  try {
    const keys = [];

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);

      if (key?.startsWith(WEATHER_CACHE_PREFIX)) {
        keys.push(key);
      }
    }

    keys.forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : null;

        const age = parsed?.timestamp
          ? Date.now() - parsed.timestamp
          : Infinity;

        if (
          !parsed?.timestamp ||
          !parsed?.data ||
          age > WEATHER_STALE_CACHE_DURATION
        ) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("Cache cleanup failed:", error);
  }
}

function clearAllWeatherCaches() {
  try {
    const keys = [];

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);

      if (key?.startsWith(WEATHER_CACHE_PREFIX)) {
        keys.push(key);
      }
    }

    keys.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn("Unable to clear weather cache:", error);
  }
}

function buildWeatherUrl(latitude, longitude) {
  return (
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    "&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,wind_direction_10m,uv_index" +
    "&hourly=temperature_2m,weather_code,precipitation_probability,relative_humidity_2m,wind_speed_10m,wind_direction_10m" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max,wind_speed_10m_max,wind_direction_10m_dominant" +
    "&forecast_days=7" +
    "&temperature_unit=celsius" +
    "&wind_speed_unit=kmh" +
    "&timezone=auto"
  );
}

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] =
    useState(false);

  const [unit, setUnit] = useState(() => {
    try {
      return localStorage.getItem("weatherUnit") || "C";
    } catch {
      return "C";
    }
  });

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] =
    useState(false);

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "recentWeatherSearches"
      );

      const parsed = saved ? JSON.parse(saved) : [];

      return Array.isArray(parsed)
        ? parsed.slice(0, 6)
        : [];
    } catch {
      return [];
    }
  });

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return (
        localStorage.getItem("weatherDarkMode") === "true"
      );
    } catch {
      return false;
    }
  });

  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] =
    useState("idle");

  const [cities, setCities] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "savedWeatherCities"
      );

      const parsed = saved ? JSON.parse(saved) : [];

      return Array.isArray(parsed)
        ? parsed.slice(0, MAX_SAVED_CITIES)
        : [];
    } catch {
      return [];
    }
  });

  const [cityWeather, setCityWeather] = useState({});
  const [selectedCity, setSelectedCity] = useState("");
  const [cacheMessage, setCacheMessage] = useState("");

  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const syncedSavedCitiesRef = useRef(new Set());
  const autoRefreshRef = useRef(null);
  const lastWeatherRefreshRef = useRef(0);
  const autoRefreshInProgressRef = useRef(false);

  const weatherRef = useRef(null);
  const loadingRef = useRef(false);
  const refreshingRef = useRef(false);

  useEffect(() => {
    weatherRef.current = weather;
  }, [weather]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    clearExpiredWeatherCaches();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "weatherDarkMode",
        String(darkMode)
      );
    } catch {
      // Ignore storage errors.
    }

    document.body.classList.toggle(
      "dark-mode",
      darkMode
    );
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem("weatherUnit", unit);
    } catch {
      // Ignore storage errors.
    }
  }, [unit]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "savedWeatherCities",
        JSON.stringify(cities)
      );
    } catch {
      // Ignore storage errors.
    }
  }, [cities]);

  const convertTemperature = useCallback(
    (value) => {
      const number = Number(value);

      if (!Number.isFinite(number)) return "--";

      return unit === "F"
        ? Math.round((number * 9) / 5 + 32)
        : Math.round(number);
    },
    [unit]
  );

  const convertWindSpeed = useCallback(
    (value) => {
      const number = Number(value);

      if (!Number.isFinite(number)) return "--";

      return unit === "F"
        ? Math.round(number * 0.621371)
        : Math.round(number);
    },
    [unit]
  );

  const windUnit = unit === "F" ? "mph" : "km/h";

  const saveRecentSearch = useCallback((cityName) => {
    if (
      !cityName ||
      cityName === "Your Location"
    ) {
      return;
    }

    setRecentSearches((previous) => {
      const updated = [
        cityName,
        ...previous.filter(
          (item) =>
            item.toLowerCase() !==
            cityName.toLowerCase()
        ),
      ].slice(0, 6);

      try {
        localStorage.setItem(
          "recentWeatherSearches",
          JSON.stringify(updated)
        );
      } catch {
        // Ignore storage errors.
      }

      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);

    try {
      localStorage.removeItem(
        "recentWeatherSearches"
      );
    } catch {
      // Ignore storage errors.
    }
  }, []);

  const addCity = useCallback(
    (cityName, locationData = {}) => {
      if (
        !cityName ||
        cityName === "Your Location"
      ) {
        return;
      }

      setCities((previous) => {
        if (
          previous.some(
            (item) =>
              item.toLowerCase() ===
              cityName.toLowerCase()
          )
        ) {
          return previous;
        }

        if (
          previous.length >= MAX_SAVED_CITIES
        ) {
          return previous;
        }

        return [...previous, cityName];
      });

      setCityWeather((previous) => ({
        ...previous,
        [cityName]: {
          ...(previous[cityName] || {}),
          ...locationData,
          loading: false,
          error: false,
          stale: false,
        },
      }));
    },
    []
  );

  const removeCity = useCallback((cityName) => {
    setCities((previous) =>
      previous.filter(
        (item) => item !== cityName
      )
    );

    setCityWeather((previous) => {
      const next = { ...previous };
      delete next[cityName];
      return next;
    });

    syncedSavedCitiesRef.current.delete(
      cityName
    );

    setSelectedCity((previous) =>
      previous === cityName ? "" : previous
    );
  }, []);

  const createWeatherObject = useCallback(
    (data, locationData = {}) => {
      const current = data?.current || {};
      const hourly = data?.hourly || {};
      const daily = data?.daily || {};

      const hourlyTimes = Array.isArray(
        hourly.time
      )
        ? hourly.time
        : [];

      const currentTime = new Date(
        current.time || Date.now()
      ).getTime();

      let currentHourlyIndex =
        hourlyTimes.findIndex(
          (time) =>
            new Date(time).getTime() >=
            currentTime
        );

      if (currentHourlyIndex < 0) {
        currentHourlyIndex = 0;
      }

      const currentRainProbability =
        hourly.precipitation_probability?.[
          currentHourlyIndex
        ] ?? null;

      const forecast = Array.isArray(
        daily.time
      )
        ? daily.time.map((date, index) => ({
            date,

            weatherCode:
              daily.weather_code?.[index] ??
              null,

            maxTemperature:
              daily.temperature_2m_max?.[
                index
              ] ?? null,

            minTemperature:
              daily.temperature_2m_min?.[
                index
              ] ?? null,

            rainProbability:
              daily
                .precipitation_probability_max?.[
                index
              ] ?? null,

            uvIndex:
              daily.uv_index_max?.[index] ??
              null,

            uvIndexMax:
              daily.uv_index_max?.[index] ??
              null,

            sunrise:
              daily.sunrise?.[index] ??
              null,

            sunset:
              daily.sunset?.[index] ??
              null,

            windSpeed:
              daily.wind_speed_10m_max?.[
                index
              ] ?? null,

            windDirection:
              daily
                .wind_direction_10m_dominant?.[
                index
              ] ?? null,
          }))
        : [];

      const hourlyForecast = hourlyTimes
        .slice(0, 24)
        .map((time, index) => ({
          time,

          temperature:
            hourly.temperature_2m?.[index] ??
            null,

          weatherCode:
            hourly.weather_code?.[index] ??
            null,

          rainProbability:
            hourly.precipitation_probability?.[
              index
            ] ?? null,

          humidity:
            hourly.relative_humidity_2m?.[
              index
            ] ?? null,

          windSpeed:
            hourly.wind_speed_10m?.[index] ??
            null,

          windDirection:
            hourly.wind_direction_10m?.[
              index
            ] ?? null,
        }));

      return {
        city:
          locationData.city ||
          locationData.name ||
          "Unknown",

        country:
          locationData.country ||
          locationData.countryCode ||
          "",

        latitude:
          locationData.latitude ?? null,

        longitude:
          locationData.longitude ?? null,

        timezone:
          data?.timezone ||
          data?.timezone_abbreviation ||
          null,

        temperature:
          current.temperature_2m ?? null,

        feelsLike:
          current.apparent_temperature ??
          null,

        weatherCode:
          current.weather_code ?? null,

        humidity:
          current.relative_humidity_2m ??
          null,

        windSpeed:
          current.wind_speed_10m ?? null,

        windDirection:
          current.wind_direction_10m ?? null,

        uvIndex:
          current.uv_index ?? null,

        rainProbability:
          currentRainProbability,

        sunrise:
          daily.sunrise?.[0] ?? null,

        sunset:
          daily.sunset?.[0] ?? null,

        forecast,
        hourly: hourlyForecast,

        fetchedAt: Date.now(),
      };
    },
    []
  );

  const applyWeather = useCallback(
    (
      weatherData,
      {
        saveRecent = true,
        updateCityInput = true,
        updateRefreshTimestamp = true,
        status = "live",
      } = {}
    ) => {
      if (!weatherData) return;

      weatherRef.current = weatherData;

      setWeather(weatherData);

      if (updateCityInput) {
        setCity(weatherData.city || "");
        setSelectedCity(
          weatherData.city || ""
        );
      }

      if (
        weatherData.city &&
        weatherData.city !== "Your Location"
      ) {
        addCity(weatherData.city, {
          temperature:
            weatherData.temperature,

          weatherCode:
            weatherData.weatherCode,

          latitude:
            weatherData.latitude,

          longitude:
            weatherData.longitude,

          windSpeed:
            weatherData.windSpeed,

          windDirection:
            weatherData.windDirection,

          rainProbability:
            weatherData.rainProbability,
        });
      }

      if (
        saveRecent &&
        weatherData.city
      ) {
        saveRecentSearch(
          weatherData.city
        );
      }

      setError("");

      if (updateRefreshTimestamp) {
        const timestamp = Date.now();

        lastWeatherRefreshRef.current =
          timestamp;

        setLastUpdated(timestamp);
      }

      setRefreshStatus(status);
    },
    [addCity, saveRecentSearch]
  );

  const fetchWeatherByCoordinates =
    useCallback(
      async (
        latitude,
        longitude,
        locationData = {},
        {
          forceRefresh = false,
          preserveExisting = false,
          saveRecent = true,
          signal = null,
        } = {}
      ) => {
        const cache = getWeatherCache(
          latitude,
          longitude
        );

        if (
          cache?.isFresh &&
          !forceRefresh
        ) {
          const cachedWeather =
            createWeatherObject(
              cache.data,
              locationData
            );

          applyWeather(cachedWeather, {
            saveRecent,
            status: "cached",
          });

          return cachedWeather;
        }

        try {
          const response = await fetch(
            buildWeatherUrl(
              latitude,
              longitude
            ),
            { signal }
          );

          if (!response.ok) {
            throw new Error(
              `Weather request failed (${response.status})`
            );
          }

          const data =
            await response.json();

          if (
            !data?.current ||
            !data?.hourly ||
            !data?.daily
          ) {
            throw new Error(
              "Weather API returned incomplete data."
            );
          }

          const weatherData =
            createWeatherObject(
              data,
              locationData
            );

          saveWeatherCache(
            latitude,
            longitude,
            data
          );

          applyWeather(weatherData, {
            saveRecent,
            status: "live",
          });

          return weatherData;
        } catch (fetchError) {
          if (
            fetchError?.name ===
              "AbortError" ||
            signal?.aborted
          ) {
            throw fetchError;
          }

          if (preserveExisting) {
            setRefreshStatus(
              weatherRef.current
                ? "cached"
                : "error"
            );

            return null;
          }

          if (cache?.data) {
            const staleWeather =
              createWeatherObject(
                cache.data,
                locationData
              );

            applyWeather(staleWeather, {
              saveRecent,
              updateRefreshTimestamp:
                false,
              status: "cached",
            });

            setError(
              "Live weather could not be updated. Showing recently cached weather."
            );

            return staleWeather;
          }

          throw fetchError;
        }
      },
      [
        applyWeather,
        createWeatherObject,
      ]
    );

  useEffect(() => {
    const query = city.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);

      return undefined;
    }

    const controller =
      new AbortController();

    const timer = setTimeout(
      async () => {
        try {
          setSuggestionsLoading(true);

          const response =
            await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
                query
              )}&count=6&language=en&format=json`,
              {
                signal:
                  controller.signal,
              }
            );

          if (!response.ok) {
            throw new Error(
              "Suggestion request failed."
            );
          }

          const data =
            await response.json();

          setSuggestions(
            Array.isArray(
              data?.results
            )
              ? data.results
              : []
          );
        } catch (suggestionError) {
          if (
            suggestionError?.name !==
            "AbortError"
          ) {
            setSuggestions([]);
          }
        } finally {
          if (
            !controller.signal.aborted
          ) {
            setSuggestionsLoading(
              false
            );
          }
        }
      },
      350
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [city]);

  const searchWeather = useCallback(
    async (
      searchCity = city,
      {
        forceRefresh = false,
        saveRecent = true,
        preserveExisting = false,
        locationData = null,
      } = {}
    ) => {
      const query =
        searchCity.trim();

      if (!query) return null;

      const requestId =
        ++requestIdRef.current;

      if (
        abortControllerRef.current
      ) {
        abortControllerRef.current.abort();
      }

      const controller =
        new AbortController();

      abortControllerRef.current =
        controller;

      setSuggestions([]);

      if (!preserveExisting) {
        setLoading(true);
        loadingRef.current = true;
      }

      setError("");

      try {
        let location =
          locationData;

        if (!location) {
          const geoResponse =
            await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
                query
              )}&count=1&language=en&format=json`,
              {
                signal:
                  controller.signal,
              }
            );

          if (!geoResponse.ok) {
            throw new Error(
              "Location search failed."
            );
          }

          const geoData =
            await geoResponse.json();

          if (
            !geoData?.results?.length
          ) {
            throw new Error(
              `Could not find "${query}".`
            );
          }

          location =
            geoData.results[0];
        }

        if (
          controller.signal.aborted ||
          requestId !==
            requestIdRef.current
        ) {
          return null;
        }

        const latitude = Number(
          location.latitude
        );

        const longitude = Number(
          location.longitude
        );

        if (
          !Number.isFinite(
            latitude
          ) ||
          !Number.isFinite(
            longitude
          )
        ) {
          throw new Error(
            "Invalid location coordinates."
          );
        }

        const locationInfo = {
          city:
            location.name ||
            query,

          country:
            location.country ||
            "",

          latitude,
          longitude,
        };

        const result =
          await fetchWeatherByCoordinates(
            latitude,
            longitude,
            locationInfo,
            {
              forceRefresh,
              preserveExisting,
              saveRecent,
              signal:
                controller.signal,
            }
          );

        if (
          requestId !==
          requestIdRef.current
        ) {
          return null;
        }

        return result;
      } catch (searchError) {
        if (
          searchError?.name ===
            "AbortError" ||
          controller.signal.aborted ||
          requestId !==
            requestIdRef.current
        ) {
          return null;
        }

        if (!preserveExisting) {
          setError(
            searchError?.message ||
              "Unable to load weather."
          );

          setRefreshStatus("error");
        }

        return null;
      } finally {
        if (
          requestId ===
            requestIdRef.current &&
          !preserveExisting
        ) {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    },
    [
      city,
      fetchWeatherByCoordinates,
    ]
  );

  const handleSuggestionClick =
    useCallback(
      (suggestion) => {
        if (!suggestion) return;

        const selectedName =
          suggestion.name || "";

        setCity(selectedName);

        searchWeather(
          selectedName,
          {
            locationData:
              suggestion,
            saveRecent: true,
          }
        );
      },
      [searchWeather]
    );

  const handleRecentSearchClick =
    useCallback(
      (recentCity) => {
        setCity(recentCity);
        searchWeather(recentCity);
      },
      [searchWeather]
    );

  const handleSearchSubmit =
    useCallback(
      (event) => {
        event.preventDefault();

        if (!city.trim()) return;

        searchWeather(city);
      },
      [city, searchWeather]
    );

  const syncSavedCityWeather =
    useCallback(
      async (
        cityName,
        signal
      ) => {
        if (
          !cityName ||
          signal?.aborted
        ) {
          return;
        }

        try {
          setCityWeather(
            (previous) => ({
              ...previous,

              [cityName]: {
                ...(previous[
                  cityName
                ] || {}),

                loading: true,
                error: false,
              },
            })
          );

          const geoResponse =
            await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
                cityName
              )}&count=1&language=en&format=json`,
              { signal }
            );

          if (!geoResponse.ok) {
            throw new Error(
              "Saved city location lookup failed."
            );
          }

          const geoData =
            await geoResponse.json();

          if (
            !geoData?.results?.length
          ) {
            throw new Error(
              "Saved city not found."
            );
          }

          const location =
            geoData.results[0];

          const latitude = Number(
            location.latitude
          );

          const longitude = Number(
            location.longitude
          );

          if (
            !Number.isFinite(
              latitude
            ) ||
            !Number.isFinite(
              longitude
            )
          ) {
            throw new Error(
              "Invalid saved city coordinates."
            );
          }

          const cache =
            getWeatherCache(
              latitude,
              longitude
            );

          let data;
          let isFresh = false;

          if (cache?.isFresh) {
            data = cache.data;
            isFresh = true;
          } else {
            const response =
              await fetch(
                buildWeatherUrl(
                  latitude,
                  longitude
                ),
                { signal }
              );

            if (!response.ok) {
              throw new Error(
                "Saved city weather request failed."
              );
            }

            data =
              await response.json();

            saveWeatherCache(
              latitude,
              longitude,
              data
            );
          }

          if (signal?.aborted) {
            return;
          }

          const mapped =
            createWeatherObject(
              data,
              {
                city: cityName,
                country:
                  location.country ||
                  "",
                latitude,
                longitude,
              }
            );

          setCityWeather(
            (previous) => ({
              ...previous,

              [cityName]: {
                ...(previous[
                  cityName
                ] || {}),

                temperature:
                  mapped.temperature,

                weatherCode:
                  mapped.weatherCode,

                loading: false,
                error: false,

                stale: !isFresh,

                latitude,
                longitude,

                country:
                  mapped.country,

                windSpeed:
                  mapped.windSpeed,

                windDirection:
                  mapped.windDirection,

                rainProbability:
                  mapped.rainProbability,
              },
            })
          );
        } catch (syncError) {
          if (
            syncError?.name ===
              "AbortError" ||
            signal?.aborted
          ) {
            return;
          }

          setCityWeather(
            (previous) => ({
              ...previous,

              [cityName]: {
                ...(previous[
                  cityName
                ] || {}),

                loading: false,
                error: true,
              },
            })
          );
        }
      },
      [createWeatherObject]
    );

  useEffect(() => {
    if (!cities.length) {
      return undefined;
    }

    const controller =
      new AbortController();

    const citiesToSync =
      cities.filter(
        (cityName) =>
          !syncedSavedCitiesRef.current.has(
            cityName
          )
      );

    citiesToSync.forEach(
      (cityName) => {
        syncedSavedCitiesRef.current.add(
          cityName
        );

        syncSavedCityWeather(
          cityName,
          controller.signal
        );
      }
    );

    return () => {
      controller.abort();

      citiesToSync.forEach(
        (cityName) => {
          syncedSavedCitiesRef.current.delete(
            cityName
          );
        }
      );
    };
  }, [
    cities,
    syncSavedCityWeather,
  ]);

  const handleSelectCity =
    useCallback(
      async (cityName) => {
        if (!cityName) return;

        setSelectedCity(cityName);

        const savedWeather =
          cityWeather[cityName];

        if (
          Number.isFinite(
            Number(
              savedWeather?.latitude
            )
          ) &&
          Number.isFinite(
            Number(
              savedWeather?.longitude
            )
          ) &&
          savedWeather?.temperature !==
            undefined &&
          !savedWeather?.error
        ) {
          setCity(cityName);
          return;
        }

        setCity(cityName);

        await searchWeather(
          cityName,
          {
            preserveExisting:
              Boolean(
                weatherRef.current
              ),
          }
        );
      },
      [cityWeather, searchWeather]
    );

  const handleRefresh =
    useCallback(async () => {
      const currentWeather =
        weatherRef.current;

      if (
        !currentWeather?.city ||
        refreshingRef.current ||
        loadingRef.current
      ) {
        return;
      }

      setRefreshing(true);
      refreshingRef.current = true;

      setRefreshStatus("updating");

      try {
        await searchWeather(
          currentWeather.city,
          {
            forceRefresh: true,
            saveRecent: false,
            preserveExisting: true,
          }
        );
      } finally {
        setRefreshing(false);
        refreshingRef.current = false;
      }
    }, [searchWeather]);

  useEffect(() => {
    if (!weather?.city) {
      return undefined;
    }

    if (autoRefreshRef.current) {
      clearInterval(
        autoRefreshRef.current
      );
    }

    autoRefreshRef.current =
      setInterval(async () => {
        if (
          autoRefreshInProgressRef.current ||
          loadingRef.current ||
          refreshingRef.current ||
          !weatherRef.current?.city
        ) {
          return;
        }

        autoRefreshInProgressRef.current =
          true;

        setRefreshStatus(
          "updating"
        );

        try {
          await searchWeather(
            weatherRef.current.city,
            {
              forceRefresh: true,
              saveRecent: false,
              preserveExisting: true,
            }
          );
        } finally {
          autoRefreshInProgressRef.current =
            false;
        }
      }, WEATHER_CACHE_DURATION);

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(
          autoRefreshRef.current
        );
      }
    };
  }, [weather?.city, searchWeather]);

  useEffect(() => {
    const handleVisibilityChange =
      async () => {
        if (
          document.visibilityState !==
          "visible"
        ) {
          return;
        }

        const currentWeather =
          weatherRef.current;

        if (
          !currentWeather?.city ||
          loadingRef.current ||
          refreshingRef.current ||
          autoRefreshInProgressRef.current
        ) {
          return;
        }

        if (
          Date.now() -
            lastWeatherRefreshRef.current <
          WEATHER_CACHE_DURATION
        ) {
          return;
        }

        autoRefreshInProgressRef.current =
          true;

        setRefreshStatus(
          "updating"
        );

        try {
          await searchWeather(
            currentWeather.city,
            {
              forceRefresh: true,
              saveRecent: false,
              preserveExisting: true,
            }
          );
        } finally {
          autoRefreshInProgressRef.current =
            false;
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [searchWeather]);

  const handleMyLocation =
    useCallback(() => {
      if (!navigator.geolocation) {
        setError(
          "Geolocation is not supported by this browser."
        );

        setRefreshStatus("error");

        return;
      }

      const requestId =
        ++requestIdRef.current;

      if (
        abortControllerRef.current
      ) {
        abortControllerRef.current.abort();
      }

      const controller =
        new AbortController();

      abortControllerRef.current =
        controller;

      setLocationLoading(true);
      setError("");
      setRefreshStatus(
        "updating"
      );

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (
            controller.signal.aborted ||
            requestId !==
              requestIdRef.current
          ) {
            return;
          }

          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;

          try {
            const result =
              await fetchWeatherByCoordinates(
                latitude,
                longitude,
                {
                  city: "Your Location",
                  country: "",
                  latitude,
                  longitude,
                },
                {
                  preserveExisting: false,
                  saveRecent: false,
                  signal:
                    controller.signal,
                }
              );

            if (
              controller.signal.aborted ||
              requestId !==
                requestIdRef.current
            ) {
              return;
            }

            if (result) {
              setCity(
                "Your Location"
              );

              setSelectedCity(
                "Your Location"
              );
            }
          } catch (locationError) {
            if (
              locationError?.name ===
                "AbortError" ||
              controller.signal.aborted ||
              requestId !==
                requestIdRef.current
            ) {
              return;
            }

            setError(
              "Unable to get weather for your location."
            );

            setRefreshStatus(
              "error"
            );
          } finally {
            if (
              requestId ===
              requestIdRef.current
            ) {
              setLocationLoading(
                false
              );
            }
          }
        },
        (locationError) => {
          if (
            controller.signal.aborted ||
            requestId !==
              requestIdRef.current
          ) {
            return;
          }

          setLocationLoading(false);

          if (
            locationError?.code === 1
          ) {
            setError(
              "Location permission was denied. Please allow location access and try again."
            );
          } else if (
            locationError?.code === 2
          ) {
            setError(
              "Your location could not be determined."
            );
          } else if (
            locationError?.code === 3
          ) {
            setError(
              "Location request timed out. Please try again."
            );
          } else {
            setError(
              "Unable to get your location."
            );
          }

          setRefreshStatus(
            "error"
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000,
        }
      );
    }, [fetchWeatherByCoordinates]);

  const handleClearCache =
    useCallback(() => {
      clearAllWeatherCaches();

      syncedSavedCitiesRef.current.clear();

      lastWeatherRefreshRef.current = 0;

      setCacheMessage(
        "Weather cache cleared successfully."
      );

      setRefreshStatus(
        weatherRef.current
          ? "cached"
          : "idle"
      );

      setCityWeather(
        (previous) => {
          const next = {};

          Object.entries(
            previous
          ).forEach(
            ([cityName, data]) => {
              next[cityName] = {
                ...data,
                stale: true,
              };
            }
          );

          return next;
        }
      );

      window.setTimeout(() => {
        setCacheMessage("");
      }, 2500);
    }, []);

  const formatTime = useCallback(
    (value) => {
      if (!value) return "--";

      const date = new Date(value);

      if (
        Number.isNaN(date.getTime())
      ) {
        return "--";
      }

      return date.toLocaleTimeString(
        [],
        {
          hour: "numeric",
          minute: "2-digit",
        }
      );
    },
    []
  );

  const refreshStatusContent =
    {
      updating: {
        label: "Updating...",
        icon: "↻",
      },

      cached: {
        label: "Cached",
        icon: "◷",
      },

      error: {
        label: "Unavailable",
        icon: "⚠",
      },

      live: {
        label: "Live",
        icon: "●",
      },

      idle: {
        label: "Ready",
        icon: "●",
      },
    }[refreshStatus] || {
      label: "Ready",
      icon: "●",
    };

  const weatherInfo = weather
    ? getWeatherInfo(
        weather.weatherCode
      )
    : null;

  const weatherType = weather
    ? getWeatherType(
        weather.weatherCode
      )
    : "unknown";

  const humidityInfo = weather
    ? getHumidityInfo(
        weather.humidity
      )
    : null;

  const rainInfo = weather
    ? getRainInfo(
        weather.rainProbability
      )
    : null;

  const uvInfo = weather
    ? getUvInfo(
        weather.uvIndex
      )
    : null;

  const alerts =
    getWeatherAlerts(weather);

  return (
    <div
      className={`app weather-type-${weatherType} ${
        darkMode ? "dark" : ""
      }`}
    >
      <header className="app-header">
        <div className="brand">
          <h1>Weather App</h1>

          <p>
            Live weather, forecasts &
            saved cities
          </p>
        </div>

        <button
          className="theme-toggle"
          type="button"
          onClick={() =>
            setDarkMode(
              (previous) => !previous
            )
          }
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </header>

      <section className="search-section">
        <form
          className="search-form"
          onSubmit={
            handleSearchSubmit
          }
        >
          <div className="search-input-wrapper">
            <input
              type="text"
              value={city}
              onChange={(event) =>
                setCity(
                  event.target.value
                )
              }
              placeholder="Search for a city..."
              autoComplete="off"
              aria-label="Search for a city"
            />

            {suggestionsLoading && (
              <span className="search-loading">
                Searching...
              </span>
            )}

            {suggestions.length >
              0 && (
              <div className="suggestions">
                {suggestions.map(
                  (suggestion) => (
                    <button
                      key={`${suggestion.id}-${suggestion.latitude}-${suggestion.longitude}`}
                      type="button"
                      className="suggestion-item"
                      onClick={() =>
                        handleSuggestionClick(
                          suggestion
                        )
                      }
                    >
                      <span className="suggestion-icon">
                        📍
                      </span>

                      <span>
                        <strong>
                          {
                            suggestion.name
                          }
                        </strong>

                        <small>
                          {[
                            suggestion.admin1,
                            suggestion.country,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              ", "
                            )}
                        </small>
                      </span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <button
            className="search-button"
            type="submit"
            disabled={
              loading ||
              !city.trim()
            }
          >
            {loading
              ? "Searching..."
              : "Search"}
          </button>
        </form>

        {recentSearches.length >
          0 && (
          <div className="recent-searches">
            <div className="recent-header">
              <span>
                Recent searches
              </span>

              <button
                type="button"
                onClick={
                  clearRecentSearches
                }
              >
                Clear
              </button>
            </div>

            <div className="recent-list">
              {recentSearches.map(
                (recentCity) => (
                  <button
                    key={recentCity}
                    type="button"
                    className="recent-chip"
                    onClick={() =>
                      handleRecentSearchClick(
                        recentCity
                      )
                    }
                  >
                    🕘 {recentCity}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        <div className="weather-actions">
          <button
            type="button"
            className="location-button"
            onClick={
              handleMyLocation
            }
            disabled={
              locationLoading
            }
          >
            {locationLoading
              ? "📍 Locating..."
              : "📍 My Location"}
          </button>

          <div className="unit-toggle">
            <button
              type="button"
              className={
                unit === "C"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setUnit("C")
              }
            >
              °C
            </button>

            <button
              type="button"
              className={
                unit === "F"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setUnit("F")
              }
            >
              °F
            </button>
          </div>

          {weather && (
            <button
              type="button"
              className="refresh-button"
              onClick={
                handleRefresh
              }
              disabled={
                refreshing ||
                loading
              }
            >
              {refreshing
                ? "↻ Updating..."
                : "↻ Refresh"}
            </button>
          )}

          <button
            type="button"
            className="clear-cache-button"
            onClick={
              handleClearCache
            }
          >
            🧹 Clear Cache
          </button>
        </div>

        {cacheMessage && (
          <div className="cache-message">
            {cacheMessage}
          </div>
        )}

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </section>

      <CitiesDashboard
        cities={cities}
        cityWeather={cityWeather}
        selectedCity={selectedCity}
        unit={unit}
        onSelect={handleSelectCity}
        onRemove={removeCity}
      />

      {weather ? (
        <main className="weather-content">
          <section className="weather-card">
            <div className="weather-card-top">
              <div>
                <span className="weather-location">
                  📍 {weather.city}
                  {weather.country
                    ? `, ${weather.country}`
                    : ""}
                </span>

                {weather.timezone && (
                  <span className="weather-timezone">
                    {weather.timezone}
                  </span>
                )}
              </div>

              <div className="weather-update-info">
                <span>
                  Last updated:{" "}
                  {lastUpdated
                    ? new Date(
                        lastUpdated
                      ).toLocaleTimeString(
                        [],
                        {
                          hour: "numeric",
                          minute:
                            "2-digit",
                        }
                      )
                    : "--"}
                </span>

                <div
                  className={`refresh-status is-${refreshStatus}`}
                  title={`Weather status: ${refreshStatusContent.label}`}
                >
                  <span className="refresh-status-icon">
                    {
                      refreshStatusContent.icon
                    }
                  </span>

                  <span>
                    {
                      refreshStatusContent.label
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="current-weather">
              <div className="current-weather-icon">
                {weatherInfo?.emoji ||
                  "🌤️"}
              </div>

              <div className="current-temperature">
                <strong>
                  {convertTemperature(
                    weather.temperature
                  )}
                  °
                </strong>

                <span>{unit}</span>
              </div>

              <div className="current-condition">
                <strong>
                  {weatherInfo?.text ||
                    "Unknown"}
                </strong>

                <span>
                  Feels like{" "}
                  {convertTemperature(
                    weather.feelsLike
                  )}
                  °{unit}
                </span>
              </div>
            </div>

            {alerts.length > 0 && (
              <div className="weather-alerts">
                {alerts.map(
                  (alert, index) => (
                    <div
                      className={`weather-alert alert-${alert.type}`}
                      key={`${alert.title}-${index}`}
                    >
                      <span className="alert-icon">
                        {alert.icon}
                      </span>

                      <div className="alert-content">
                        <strong>
                          {alert.title}
                        </strong>

                        <p>
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="weather-details">
              <div className="weather-detail">
                <span className="detail-icon">
                  💧
                </span>

                <div>
                  <small>
                    Humidity
                  </small>

                  <strong>
                    {Number.isFinite(
                      Number(
                        weather.humidity
                      )
                    )
                      ? `${Math.round(
                          Number(
                            weather.humidity
                          )
                        )}%`
                      : "--"}
                  </strong>

                  <span>
                    {
                      humidityInfo?.label
                    }
                  </span>
                </div>
              </div>

              <div className="weather-detail">
                <span className="detail-icon">
                  💨
                </span>

                <div>
                  <small>
                    Wind
                  </small>

                  <strong>
                    {
                      convertWindSpeed(
                        weather.windSpeed
                      )
                    }{" "}
                    {windUnit}
                  </strong>

                  <span>
                    {getWindDirection(
                      weather.windDirection
                    )}
                  </span>
                </div>
              </div>

              <div className="weather-detail">
                <span className="detail-icon">
                  ☀️
                </span>

                <div>
                  <small>
                    UV Index
                  </small>

                  <strong>
                    {Number.isFinite(
                      Number(
                        weather.uvIndex
                      )
                    )
                      ? Math.round(
                          Number(
                            weather.uvIndex
                          )
                        )
                      : "--"}
                  </strong>

                  <span>
                    {uvInfo?.label}
                  </span>
                </div>
              </div>

              <div className="weather-detail">
                <span className="detail-icon">
                  🌧️
                </span>

                <div>
                  <small>
                    Rain Chance
                  </small>

                  <strong>
                    {Number.isFinite(
                      Number(
                        weather.rainProbability
                      )
                    )
                      ? `${Math.round(
                          Number(
                            weather.rainProbability
                          )
                        )}%`
                      : "--"}
                  </strong>

                  <span>
                    {rainInfo?.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="sun-times">
              <div className="sun-time">
                <span>🌅</span>

                <div>
                  <small>
                    Sunrise
                  </small>

                  <strong>
                    {formatTime(
                      weather.sunrise
                    )}
                  </strong>
                </div>
              </div>

              <div className="sun-time">
                <span>🌇</span>

                <div>
                  <small>
                    Sunset
                  </small>

                  <strong>
                    {formatTime(
                      weather.sunset
                    )}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section className="forecast-center">
            <div className="forecast-center-header">
              <div>
                <span className="forecast-eyebrow">
                  FORECAST CENTER
                </span>

                <h2>
                  Weather Forecast
                </h2>

                <p>
                  Plan your day with
                  the next 24 hours
                  and the next 7 days.
                </p>
              </div>

              <div className="forecast-summary-badges">
                <span>
                  🕐 24 Hours
                </span>

                <span>
                  📅 7 Days
                </span>
              </div>
            </div>

            {Array.isArray(
              weather.hourly
            ) &&
              weather.hourly.length >
                0 && (
                <section className="forecast-block">
                  <div className="forecast-block-title">
                    <div>
                      <span className="forecast-block-icon">
                        🕐
                      </span>

                      <div>
                        <h3>
                          24-Hour Forecast
                        </h3>

                        <p>
                          Hourly
                          temperature,
                          rain chance,
                          humidity and
                          wind
                        </p>
                      </div>
                    </div>
                  </div>

                  <HourlyForecast
                    hourly={
                      weather.hourly
                    }
                    unit={unit}
                  />
                </section>
              )}

            {Array.isArray(
              weather.forecast
            ) &&
              weather.forecast.length >
                0 && (
                <section className="forecast-block">
                  <div className="forecast-block-title">
                    <div>
                      <span className="forecast-block-icon">
                        📅
                      </span>

                      <div>
                        <h3>
                          7-Day Forecast
                        </h3>

                        <p>
                          Daily highs,
                          lows, rain
                          probability,
                          UV, wind and
                          sun times
                        </p>
                      </div>
                    </div>
                  </div>

                  <DailyForecast
                    daily={
                      weather.forecast
                    }
                    unit={unit}
                  />
                </section>
              )}
          </section>
        </main>
      ) : (
        <main className="welcome-section">
          <div className="welcome-icon">
            🌤️
          </div>

          <h2>
            Check the Weather
          </h2>

          <p>
            Search for any city to
            see current conditions,
            hourly weather, and a
            7-day forecast.
          </p>

          <div className="welcome-features">
            <span>
              🌡️ Live Temperature
            </span>

            <span>
              🕐 24-Hour Forecast
            </span>

            <span>
              📅 7-Day Forecast
            </span>

            <span>
              📍 My Location
            </span>
          </div>
        </main>
      )}

      <footer className="app-footer">
        <span>
          Weather data powered by
          Open-Meteo
        </span>
      </footer>
    </div>
  );
}

export default App;