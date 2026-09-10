export function getWeatherInfo(code) {
  if (code === 0) {
    return {
      text: "Clear Sky",
      emoji: "☀️",
    };
  }

  if (code === 1) {
    return {
      text: "Mainly Clear",
      emoji: "🌤️",
    };
  }

  if (code === 2) {
    return {
      text: "Partly Cloudy",
      emoji: "⛅",
    };
  }

  if (code === 3) {
    return {
      text: "Overcast",
      emoji: "☁️",
    };
  }

  if (code >= 45 && code <= 48) {
    return {
      text: "Fog",
      emoji: "🌫️",
    };
  }

  if (code >= 51 && code <= 57) {
    return {
      text: "Drizzle",
      emoji: "🌦️",
    };
  }

  if (code >= 61 && code <= 67) {
    return {
      text: "Rain",
      emoji: "🌧️",
    };
  }

  if (code >= 71 && code <= 77) {
    return {
      text: "Snow",
      emoji: "❄️",
    };
  }

  if (code >= 80 && code <= 82) {
    return {
      text: "Rain Showers",
      emoji: "🌦️",
    };
  }

  if (code >= 85 && code <= 86) {
    return {
      text: "Snow Showers",
      emoji: "🌨️",
    };
  }

  if (code >= 95 && code <= 99) {
    return {
      text: "Thunderstorm",
      emoji: "⛈️",
    };
  }

  return {
    text: "Unknown",
    emoji: "🌤️",
  };
}

export function celsiusToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

export function formatTemperature(value, unit = "C") {
  if (value === null || value === undefined) {
    return "--";
  }

  const temperature = unit === "F" ? celsiusToFahrenheit(value) : value;

  return Math.round(temperature);
}

export function formatHour(time) {
  if (!time) {
    return "--";
  }

  const date = new Date(time);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDay(time) {
  if (!time) {
    return "--";
  }

  const date = new Date(time);

  return date.toLocaleDateString([], {
    weekday: "short",
  });
}

export function formatDate(time) {
  if (!time) {
    return "--";
  }

  const date = new Date(time);

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}
