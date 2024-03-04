import { useState, useEffect } from 'react';
import { useLocalStorageState } from './useLocalStorageState';

//принимает код погоды  и возвращает  эмодзи
function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], '☀️'],
    [[1], '🌤'],
    [[2], '⛅️'],
    [[3], '☁️'],
    [[45, 48], '🌫'],
    [[51, 56, 61, 66, 80], '🌦'],
    [[53, 55, 63, 65, 57, 67, 81, 82], '🌧'],
    [[71, 73, 75, 77, 85, 86], '🌨'],
    [[95], '🌩'],
    [[96, 99], '⛈'],
  ]);

  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return 'NOT FOUND';
  return icons.get(arr);
}
//принимает код страны  и возвращает эмодзи флага этой страны
function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}
// принимает строку с датой и возвращает короткое название дня недели для этой даты
function formatDay(dateStr) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
  }).format(new Date(dateStr));
}

export default function App() {
  const [location, setLocation] = useLocalStorageState('', 'location');
  const [isLoding, setIsLoding] = useState(false);
  const [displayLocation, setDisplayLocation] = useState('');
  const [weather, setWeather] = useState({});

  useEffect(
    function () {
      async function fetchWeather() {
        if (location.length < 2) return;
        try {
          setIsLoding(true);
          // 1) Получение местоположения (геокодирование)
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
          );
          const geoData = await geoRes.json();
          console.log('geoData>>>', geoData);

          if (!geoData.results) throw new Error('Location not found');

          const { latitude, longitude, timezone, name, country_code } =
            geoData.results.at(0);

          setDisplayLocation(`${name}
            ${convertToFlag(country_code)}`);

          // 2) Получение фактической погоды
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
          );
          const weatherData = await weatherRes.json();
          console.log(weatherData);
          setWeather(weatherData.daily);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoding(false);
        }
      }
      fetchWeather();
    },
    [location]
  );

  return (
    <div className="app">
      <h1>Classy Weather</h1>
      <Input location={location} onChangeLocation={setLocation} />
      {isLoding && <Loader />}
      {weather.weathercode && (
        <Weather weather={weather} location={displayLocation} />
      )}
    </div>
  );
}

function Loader() {
  return <p className="loader">Loader...</p>;
}

function Input({ location, onChangeLocation }) {
  return (
    <div>
      <input
        type="text"
        placeholder="Search for location..."
        value={location}
        onChange={(e) => onChangeLocation(e.target.value)}
      />
    </div>
  );
}

function Weather({ weather, location }) {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather;
  console.log(weather);
  return (
    <div>
      <h2>Weather {location}</h2>
      <ul className="weather">
        {dates.map((date, i) => (
          <Day
            date={date}
            max={max.at(i)}
            min={min.at(i)}
            code={codes.at(i)}
            key={date}
            isToday={i === 0}
          />
        ))}
      </ul>
    </div>
  );

  function Day({ date, max, min, code, isToday }) {
    return (
      <li className="day">
        <span>{getWeatherIcon(code)}</span>
        <p>{isToday ? 'Today' : formatDay(date)}</p>
        <p>
          {Math.floor(min)}&deg; &mdash;<strong>{Math.ceil(max)}&deg;</strong>
        </p>
      </li>
    );
  }
}
