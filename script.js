// Constants and Selectors
const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");

// APIs
const API_KEY = "30a804e4a6002eabfe239fc3790a99a3";  // OpenWeatherMap API key
const STORMGLASS_API_KEY = "2a49fe54-37de-11ef-968a-0242ac130004-2a49fee0-37de-11ef-968a-0242ac130004"; //Marine API
const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast`;
const GEOCODE_API_URL = `https://api.openweathermap.org/geo/1.0`;

// Unit conversions
const convertKelvinToFahrenheit = (kelvin) => (kelvin - 273.15) * (9 / 5) + 32;
const convertMSToMPH = (metersPerSecond) => metersPerSecond * 2.237;

const fetchWeatherFromStormglass = (lat, lon, params) => {
  const url = `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lon}&params=${params}`;
  return fetch(url, {
    headers: {
      'Authorization': STORMGLASS_API_KEY
    }
  }).then(response => response.json());
};

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
        const imageUrl = data.photos[0].src.original;
        document.body.style.backgroundImage = `url(${imageUrl})`;
      } else {
        console.error("No photos found for the query.");
      }
    })
    .catch(error => {
      console.error("Error fetching background image:", error);
    });
};

const createWeatherCard = (cityName, weatherItem, index) => {
  const { main, wind, weather, dt_txt } = weatherItem;
  const temperatureInFahrenheit = convertKelvinToFahrenheit(main.temp);
  const feelsLikeTemperatureInFahrenheit = convertKelvinToFahrenheit(main.feels_like);
  const windSpeedInMPH = convertMSToMPH(wind.speed);

  // Convert date to day of the week and formatted date (without parentheses and year)
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

const getWeatherDetails = (cityName, latitude, longitude) => {
  const url = `${WEATHER_API_URL}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const uniqueForecastDays = [];
      const fiveDaysForecast = data.list.filter(forecast => {
        const forecastDate = new Date(forecast.dt_txt).getDate();
        return uniqueForecastDays.includes(forecastDate) ?
          false : uniqueForecastDays.push(forecastDate);
      });

      cityInput.value = "";
      currentWeatherDiv.innerHTML = "";
      weatherCardsDiv.innerHTML = "";

      fiveDaysForecast.forEach((weatherItem, index) => {
        const html = createWeatherCard(cityName, weatherItem, index);
        index === 0 ?
          currentWeatherDiv.insertAdjacentHTML("beforeend", html) :
          weatherCardsDiv.insertAdjacentHTML("beforeend", html);
      });

      // Get current weather description for background image
      const currentWeatherDescription = data.list[0].weather[0].description;
      fetchBackgroundImage(currentWeatherDescription);
    })
    .catch(() => {
      alert("An error occurred while fetching the weather forecast!");
    });
};

// Fetch City Coordinates Function
const fetchCityCoordinates = (cityName) => {
  const url = `${GEOCODE_API_URL}/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (!data.length) {
        throw new Error(`No coordinates found for ${cityName}`);
      }
      const { lat, lon, name } = data[0];
      getWeatherDetails(name, lat, lon);
    })
    .catch(() => {
      alert("An error occurred while fetching the coordinates!");
    });
};

// Fetch User Coordinates Function
const fetchUserCoordinates = () => {
  navigator.geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;
      const url = `${GEOCODE_API_URL}/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;

      fetch(url)
        .then(response => response.json())
        .then(data => {
          const { name } = data[0];
          getWeatherDetails(name, latitude, longitude);
        })
        .catch(() => {
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

// Event Listeners
locationButton.addEventListener("click", fetchUserCoordinates);
searchButton.addEventListener("click", () => fetchCityCoordinates(cityInput.value.trim()));
cityInput.addEventListener("keyup", e => {
  if (e.key === "Enter") {
    fetchCityCoordinates(cityInput.value.trim());
  }
});
