import { useEffect, useRef } from "react";

import { getCachedWeather, setCachedWeather } from "../utils/cacheUtils";

import { getWeather } from "../services/weatherApi";

export function useWeatherRequest() {
  const controllerRef = useRef(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const fetchWeather = async (
    latitude,
    longitude,
    cityKey,
    forceRefresh = false,
  ) => {
    // Cancel previous request
    controllerRef.current?.abort();

    // Create new controller
    const controller = new AbortController();
    controllerRef.current = controller;

    // Check cache first
    if (!forceRefresh) {
      const cached = getCachedWeather(cityKey);

      if (cached?.isFresh) {
        return {
          data: cached.data,
          fetchedAt: cached.fetchedAt,
          fromCache: true,
          isStale: false,
        };
      }
    }

    try {
      const data = await getWeather(latitude, longitude, controller.signal);

      setCachedWeather(cityKey, data);

      return {
        data,
        fetchedAt: Date.now(),
        fromCache: false,
        isStale: false,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return {
          aborted: true,
        };
      }

      // If API fails, try stale cache
      const cached = getCachedWeather(cityKey);

      if (cached) {
        return {
          data: cached.data,
          fetchedAt: cached.fetchedAt,
          fromCache: true,
          isStale: true,
        };
      }

      throw error;
    }
  };

  const cancelRequest = () => {
    controllerRef.current?.abort();
  };

  return {
    fetchWeather,
    cancelRequest,
  };
}
