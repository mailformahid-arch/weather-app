const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const CACHE_KEY = "weatherCache";

function getCache() {
  try {
    const stored = localStorage.getItem(CACHE_KEY);

    if (!stored) {
      return {};
    }

    return JSON.parse(stored);
  } catch {
    return {};
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore localStorage errors
  }
}

export function getCachedWeather(cityKey) {
  const cache = getCache();
  const item = cache[cityKey];

  if (!item) {
    return null;
  }

  const age = Date.now() - item.fetchedAt;

  return {
    data: item.data,
    fetchedAt: item.fetchedAt,
    isFresh: age < CACHE_DURATION,
    isStale: age >= CACHE_DURATION,
  };
}

export function setCachedWeather(cityKey, data) {
  const cache = getCache();

  cache[cityKey] = {
    data,
    fetchedAt: Date.now(),
  };

  saveCache(cache);
}

export function removeCachedWeather(cityKey) {
  const cache = getCache();

  delete cache[cityKey];

  saveCache(cache);
}

export function clearWeatherCache() {
  localStorage.removeItem(CACHE_KEY);
}

export function getCacheAge(fetchedAt) {
  if (!fetchedAt) {
    return 0;
  }

  return Date.now() - fetchedAt;
}

export function getCacheDuration() {
  return CACHE_DURATION;
}
