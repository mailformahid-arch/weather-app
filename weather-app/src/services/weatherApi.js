const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

export async function searchCities(city, signal) {
  const url =
    `${GEOCODING_API}?name=${encodeURIComponent(city)}` +
    `&count=5&language=en&format=json`;

  const response = await fetch(url, {
    signal,
  });

  if (!response.ok) {
    throw new Error("City search failed");
  }

  const data = await response.json();

  return data.results || [];
}

export async function getWeather(latitude, longitude, signal) {
  const url =
    `${WEATHER_API}?latitude=${latitude}` +
    `&longitude=${longitude}` +
    "&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,uv_index" +
    "&hourly=temperature_2m,weather_code,precipitation_probability,relative_humidity_2m,wind_speed_10m" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max" +
    "&forecast_days=7" +
    "&temperature_unit=celsius" +
    "&wind_speed_unit=kmh" +
    "&timezone=auto";

  const response = await fetch(url, {
    signal,
  });

  if (!response.ok) {
    throw new Error("Weather request failed");
  }

  return response.json();
}
