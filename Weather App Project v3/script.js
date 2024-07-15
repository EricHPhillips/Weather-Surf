// Constants and Selectors
const cityInput = document.querySelector(".city-input");
const zipInput = document.querySelector(".zip-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");

// Marine forecast selectors
const currentWaveHeight = document.getElementById('current-wave-height');
const currentWaveDirection = document.getElementById('current-wave-direction');
const currentWavePeriod = document.getElementById('current-wave-period');
const currentWindWaveHeight = document.getElementById('current-wind-wave-height');
const hourlyMarineList = document.getElementById('hourly-marine-list');
const dailyMarineList = document.getElementById('daily-marine-list');

// APIs
const API_KEY = "30a804e4a6002eabfe239fc3790a99a3";   // open weather API
const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast`;
const GEOCODE_API_URL = `https://api.openweathermap.org/geo/1.0`;
const WEATHER_GOV_API_URL = `https://api.weather.gov/points/`;

// Unit conversions
const convertKelvinToFahrenheit = (kelvin) => (kelvin - 273.15) * (9 / 5) + 32;
const convertMSToMPH = (metersPerSecond) => metersPerSecond * 2.237;
const convertMetersToFeet = (meters) => meters * 3.28084;

// Fetch data from Weather.gov API
const fetchWeatherFromWeatherGov = async (lat, lon) => {
  const url = `https://api.weather.gov/marine/point?lat=${lat}&lon=${lon}`;
  try {
    console.log(`Fetching marine data from URL: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'myweatherapp.com, contact@myweatherapp.com'
      }
    });
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Weather.gov marine data:', data);
    return data;
  } catch (error) {
    console.error('Error in fetchWeatherFromWeatherGov:', error);
  }
};

// Default background image URL
const DEFAULT_BACKGROUND_IMAGE = 'https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg';
document.body.style.backgroundImage = 'url(' + DEFAULT_BACKGROUND_IMAGE + ')';

const fetchBackgroundImage = (weatherDescription) => {
  const apiKey = "osdHLVbDBTk5YtwkkRcCnAEez33OteIsfgqXDsGKXyxaMD2S4SNTwJD4";
  const query = encodeURIComponent(weatherDescription); // Encode weather description for URL
  const perPage = 14;

  const url = `https://api.pexels.com/v1/search?query=${query}&per_page=${perPage}`;

  fetch(url, {
    headers: {
      Authorization: apiKey
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.photos && data.photos.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.photos.length);
        const imageUrl = data.photos[randomIndex].src.original;
        document.body.style.backgroundImage = `url(${imageUrl})`;
      } else {
        console.error("No photos found for the query.");
      }
    })
    .catch(error => {
      console.error("Error fetching background image:", error);
    });
};

// Create weather card for forecast
const createWeatherCard = (cityName, weatherItem, index) => {
  const { main, wind, weather, dt_txt } = weatherItem;
  const temperatureInFahrenheit = convertKelvinToFahrenheit(main.temp);
  const feelsLikeTemperatureInFahrenheit = convertKelvinToFahrenheit(main.feels_like);
  const windSpeedInMPH = convertMSToMPH(wind.speed);

// Convert date to day of the week and formatted date
  const dateObj = new Date(dt_txt);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = days[dateObj.getDay()];
  const formattedDate = `${dayOfWeek}, ${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const html = index === 0 ?
    `<div class="details">
       <h2>${cityName} (${formattedDate})</h2>
       <h6>Temperature: ${temperatureInFahrenheit.toFixed(2)}°F</h6>
       <h6>Feels Like: ${feelsLikeTemperatureInFahrenheit.toFixed(2)}°F</h6>
       <h6>Wind: ${windSpeedInMPH.toFixed(2)} MPH</h6>
       <h6>Humidity: ${main.humidity}%</h6>
     </div>
     <div class="icon">
       <img src="https://openweathermap.org/img/wn/${weather[0].icon}.png" alt="weather-icon">
       <h6>${weather[0].description}</h6>
     </div>` :
    `<li class="card">
       <h3>${formattedDate}</h3>
       <img src="https://openweathermap.org/img/wn/${weather[0].icon}.png" alt="weather-icon">
       <h6>Temp: ${temperatureInFahrenheit.toFixed(2)}°F</h6>
       <h6>Feels Like: ${feelsLikeTemperatureInFahrenheit.toFixed(2)}°F</h6>
       <h6>Wind: ${windSpeedInMPH.toFixed(2)} MPH</h6>
       <h6>Humidity: ${main.humidity}%</h6>
     </li>`;

  return html;
};

// Get weather details and marine data
const getWeatherDetails = async (cityName, latitude, longitude) => {
  const url = `${WEATHER_API_URL}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;
  try {
    console.log(`Fetching weather details from URL: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    console.log('Weather details data:', data);
    const uniqueForecastDays = [];
    const fiveDaysForecast = data.list.filter(forecast => {
      const forecastDate = new Date(forecast.dt_txt).getDate();
      return uniqueForecastDays.includes(forecastDate) ?
        false : uniqueForecastDays.push(forecastDate);
    });

    cityInput.value = "";
    zipInput.value = "";
    currentWeatherDiv.innerHTML = "";
    weatherCardsDiv.innerHTML = "";

    fiveDaysForecast.forEach((weatherItem, index) => {
      const html = createWeatherCard(cityName, weatherItem, index);
      index === 0 ?
        currentWeatherDiv.insertAdjacentHTML("beforeend", html) :
        weatherCardsDiv.insertAdjacentHTML("beforeend", html);
    });

    const currentWeatherDescription = data.list[0].weather[0].description;
    fetchBackgroundImage(currentWeatherDescription);

    try {
      const marineData = await fetchMarineData(latitude, longitude);
      if (marineData) { 
        updateMarineForecast(marineData);
      }
    } catch (error) {
      console.error('Error fetching or updating marine forecast:', error);
    }
  } catch (error) {
    console.error('Error in getWeatherDetails:', error);
    alert("An error occurred while fetching the weather forecast!");
  }
};

// Fetch city coordinates based on city name
const fetchCityCoordinates = async (cityName) => {
  const url = `${GEOCODE_API_URL}/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
  try {
    console.log(`Fetching city coordinates from URL: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    console.log('City coordinates data:', data);
    if (!data.length) {
      throw new Error(`No coordinates found for ${cityName}`);
    }
    const { lat, lon, name } = data[0];
    console.log(`Coordinates for ${cityName}: Latitude ${lat}, Longitude ${lon}`);
    getWeatherDetails(name, lat, lon);
  } catch (error) {
    console.error('Error in fetchCityCoordinates:', error);
    alert("An error occurred while fetching the coordinates!");
  }
};

// Fetch weather details by ZIP code
const fetchWeatherByZipCode = async (zipCode) => {
  const url = `https://api.openweathermap.org/data/2.5/weather?zip=${zipCode}&appid=${API_KEY}`;
  try {
    console.log(`Fetching weather details from URL: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    console.log('Weather details data:', data);
    const { coord, name } = data;
    getWeatherDetails(name, coord.lat, coord.lon);
  } catch (error) {
    console.error('Error in fetchWeatherByZipCode:', error);
    alert("An error occurred while fetching the weather by ZIP code!");
  }
};

// Fetch user coordinates based on geolocation
const fetchUserCoordinates = () => {
  navigator.geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;
      console.log(`User coordinates: Latitude ${latitude}, Longitude ${longitude}`);
      const url = `${GEOCODE_API_URL}/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
      fetch(url)
        .then(response => response.json())
        .then(data => {
          console.log('User coordinates data:', data);
          const { name } = data[0];
          getWeatherDetails(name, latitude, longitude);
        })
        .catch(error => {
          console.error('Error in fetchUserCoordinates:', error);
          alert("An error occurred while fetching the city name!");
        });
    },
    error => {
      if (error.code === error.PERMISSION_DENIED) {
        alert("Geolocation request denied. Please reset location permission to grant access again.");
      } else {
        alert("Geolocation request error. Please reset location permission.");
      }
    }
  );
};

// Update marine forecast data in the UI
const fetchGridForecastEndpoint = async (lat, lon) => {
  const url = `https://api.weather.gov/points/${lat},${lon}`;
  try {
    console.log(`Fetching grid endpoint from URL: ${url}`);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'myweatherapp.com, contact@myweatherapp.com' }
    });
    if (!response.ok) throw new Error(`Error fetching grid endpoint: ${response.statusText}`);
    const data = await response.json();
    return data.properties.forecastGridData; // URL for raw grid data
  } catch (error) {
    console.error('Error in fetchGridForecastEndpoint:', error);
  }
};

const fetchMarineData = async (lat, lon) => {
  const gridDataUrl = await fetchGridForecastEndpoint(lat, lon);
  try {
    console.log(`Fetching marine data from URL: ${gridDataUrl}`);
    const response = await fetch(gridDataUrl, {
      headers: { 'User-Agent': 'myweatherapp.com, contact@myweatherapp.com' }
    });
    if (!response.ok) throw new Error(`Error fetching marine data: ${response.statusText}`);
    const data = await response.json();
    console.log('Marine forecast data:', data);
    return data; // JSON data with layers
  } catch (error) {
    console.error('Error in fetchMarineData:', error);
  }
};

const updateMarineForecast = (data) => {
  console.log('Updating marine forecast with data:', data);
  if (!data || !data.properties) {
    console.error('No valid marine data available');
    return;
  }

  const properties = data.properties;

  const waveHeight = properties.waveHeight;
  const wavePeriod = properties.wavePeriod;
  const windWaveHeight = properties.windWaveHeight;
  const waveDirection = properties.waveDirection;

  const latestWaveHeight = waveHeight ? waveHeight.values[0].value : 'N/A';
  const latestWavePeriod = wavePeriod ? wavePeriod.values[0].value : 'N/A';
  const latestWindWaveHeight = windWaveHeight ? windWaveHeight.values[0].value : 'N/A';
  const latestWaveDirection = waveDirection ? waveDirection.values[0].value : 'N/A';

  currentWaveHeight.textContent = `Wave Height: ${latestWaveHeight} ft`;
  currentWavePeriod.textContent = `Wave Period: ${latestWavePeriod} s`;
  currentWindWaveHeight.textContent = `Wind Wave Height: ${latestWindWaveHeight} ft`;
  currentWaveDirection.textContent = `Wave Direction: ${latestWaveDirection}°`;
};

fetchBackgroundImage('weather');

// Event Listeners
locationButton.addEventListener("click", fetchUserCoordinates);
searchButton.addEventListener("click", () => {
  const city = cityInput.value.trim();
  const zipCode = zipInput.value.trim();

  if (zipCode) {
    fetchWeatherByZipCode(zipCode);
  } else if (city) {
    fetchCityCoordinates(city);
  } else {
    alert("Please enter a city name or ZIP code!");
  }
});
cityInput.addEventListener("keyup", e => {
  if (e.key === "Enter") {
    const city = cityInput.value.trim();
    const zipCode = zipInput.value.trim();

    if (zipCode) {
      fetchWeatherByZipCode(zipCode);
    } else if (city) {
      fetchCityCoordinates(city);
    } else {
      alert("Please enter a city name or ZIP code!");
    }
  }
});
zipInput.addEventListener("keyup", e => {
  if (e.key === "Enter") {
    const city = cityInput.value.trim();
    const zipCode = zipInput.value.trim();

    if (zipCode) {
      fetchWeatherByZipCode(zipCode);
    } else if (city) {
      fetchCityCoordinates(city);
    } else {
      alert("Please enter a city name or ZIP code!");
    }
  }
});
