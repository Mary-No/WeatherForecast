// src/services/apiService.js

const API_KEY_WEATHER = "76088a478fe69c6f352e92e6bdef7e62"; // Ключ для погоды
const API_KEY_GEOLOCATION = "310595828dc44fea862411b9cab9f11d"; // Ключ для геолокации
const USERNAME_GEONAMES = "mrastartes"; // Имя пользователя для GeoNames

// Функция для получения координат города
export const fetchCityCoordinates = async (city) => {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${API_KEY_WEATHER}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw response
    }
    const geoData = await response.json();
    if (geoData.length === 0) {
        throw {status: 404, message: 'City not found'};
    }
    return geoData[0]; // Возвращаем объект с lat и lon
};

// Функция для получения погоды по координатам
export const fetchWeatherNow = async (lat, lon, language) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY_WEATHER}&units=metric&lang=${language}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw response;
    }
    return await response.json();
};

// Функция для получения прогноза погоды
export const fetchWeatherForecast = async (city, language) => {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY_WEATHER}&units=metric&lang=${language}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw response;
    }
    return await response.json();
};

// Функция для определения местоположения пользователя через IP
export const fetchUserGeolocation = async () => {
    const url = `https://api.ipgeolocation.io/ipgeo?apiKey=${API_KEY_GEOLOCATION}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw response;
    }
    return await response.json();
};

// Функция для автодополнения городов
export const fetchCitySuggestions = async (city, language) => {
    const url = `https://corsproxy.io/?http://api.geonames.org/search?q=${city}&maxRows=8&style=LONG&username=${USERNAME_GEONAMES}&type=json&fuzzy=0.5&lang=${language}&searchlang=${language}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw response;
    }
    return await response.json();
};
