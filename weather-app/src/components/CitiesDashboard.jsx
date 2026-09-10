import CityCard from "./CityCard";

function CitiesDashboard({
  cities,
  cityWeather,
  selectedCity,
  unit,
  onSelect,
  onRemove,
}) {
  if (!cities || cities.length === 0) {
    return null;
  }

  return (
    <section className="cities-dashboard">
      <div className="cities-dashboard-header">
        <div>
          <h2>My Cities</h2>

          <p>
            {cities.length} / 8 cities saved
          </p>
        </div>
      </div>

      <div className="cities-grid">
        {cities.map((city) => {
          const weather = cityWeather[city] || {};

          return (
            <CityCard
              key={city}
              city={city}
              temperature={weather.temperature}
              weatherCode={weather.weatherCode}
              loading={weather.loading}
              error={weather.error}
              stale={weather.stale}
              unit={unit}
              selected={selectedCity === city}
              onSelect={() => onSelect(city)}
              onRemove={() => onRemove(city)}
            />
          );
        })}
      </div>
    </section>
  );
}

export default CitiesDashboard;