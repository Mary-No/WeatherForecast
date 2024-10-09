import './css/App.css';
import {useEffect, useMemo, useState} from "react";
import loadingGif from "./assets/icons/loadingSVG.svg"
import LangRadioButtons from "./components/LangRadioButtons/LangRadioButtons";

function App() {

    const [weatherRightNowData, setWeatherRightNowData] = useState({});
    const [weatherForecastData, setWeatherForecastData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dates, setDates] = useState([]);
    const [cityFilled, setCityFilled] = useState('');
    const [city, setCity] = useState('');
    const [citiesInLocalStorage, setCitiesInLocalStorage] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [language, setLanguage] = useState('eng');


    const translation = {
        'ru': {
            feeling: "Чувствуется как ",
            humidity: "Влажность: ",
            windSpeed: "Скорость ветра: ",
            input: 'Введите название города',
            send: 'Отправить'
        },
        'eng': {
            feeling: "Feels like ",
            humidity: "Humidity: ",
            windSpeed: "Wind speed: ",
            input: "Enter the city name",
            send: 'Send'
        },
        'es': {
            feeling: "Se siente como ",
            humidity: "Humedad: ",
            windSpeed: "Velocidad del viento: ",
            input:'Introduzca el nombre de la ciudad',
            send: 'Enviar'
        }
    }

    const dateHandler =  (date) =>{
        // разделяем дату и время
        const [datePart, timePart] = date.split(" ")
        // меняем формат времени
        const [year, month, day] = datePart.split("-")
        const formattedDate = `${day}.${month}.${year}`
        //убираем секунды во времени
        const formattedTime = timePart.slice(0, 5)
        return {date: formattedDate, time: formattedTime}
    }


    async function weatherForecast(city) {
        setLoading(true);
        setError(null);
        const API_key = "76088a478fe69c6f352e92e6bdef7e62"
        const url_geo = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${API_key}`;
        try {
            // Получить ширину и долготу по названию города
            const geoResponse = await fetch(url_geo);
            if (!geoResponse.ok) {
                throw new Error(`Error in geo-coding request: ${geoResponse.status} ${geoResponse.statusText}`);
            }
            const geoData = await geoResponse.json();
            if (geoData.length === 0) {
                debugger
                throw new Error('404')
            }

            const lat = geoData[0].lat;
            const lon = geoData[0].lon;

            // Используя ширину и долготу, получить информацию о погоде в данный момент
            const url_weather = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_key}&units=metric&lang=${language}`
            const weatherResponse = await fetch(url_weather);
            if (!weatherResponse.ok) {
                throw new Error(weatherResponse.status);
            }

            const weatherRightNowData = await weatherResponse.json();

            // Получить прогноз погоды на ближайшие 5 дней
            const url_weather_forecast = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_key}&units=metric&lang=${language}`
            const weatherForecastResponse = await fetch(url_weather_forecast);
            if (!weatherForecastResponse.ok) {
                throw new Error(weatherForecastResponse.status);
            }
            const weatherForecastData = await weatherForecastResponse.json();

            const temperatureForecastByDate = {}
            for (let i = weatherForecastData.list.length - 1; i >= 0; i--) {
                let objDateTime = dateHandler((weatherForecastData.list[i].dt_txt))
                if (!temperatureForecastByDate[objDateTime.date]) {
                    temperatureForecastByDate[objDateTime.date] = {}
                }
                temperatureForecastByDate[objDateTime.date][objDateTime.time] = [Math.round(weatherForecastData.list[i].main.temp), weatherForecastData.list[i].weather[0].description, weatherForecastData.list[i].weather[0].icon]
            }

            const dates = Object.keys(temperatureForecastByDate).reverse()
            setDates(dates)

            setWeatherRightNowData(weatherRightNowData)
            setWeatherForecastData(temperatureForecastByDate)

        } catch (err) {
            switch (err.message) {
                case 'Failed to fetch': {
                    setError('Please check your internet connection')
                    break
                }
                case '404': {
                    setWeatherRightNowData({})
                    setWeatherForecastData({})
                    setError('Sorry, there is no data about this city')
                    break
                }
                case '500': {
                    setError('Server error. Try again later')
                    break
                }
                case '429': {
                    setError('Too many requests. Try again later')
                    break
                }
                default:
                    setError('An unexpected error occurred.  Try again')
                    break
            }
        } finally {
            setLoading(false)
        }
    }

    async function defineUserGeolocation() {
        const API_key = "310595828dc44fea862411b9cab9f11d"
        const url = `https://api.ipgeolocation.io/ipgeo?apiKey=${API_key}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error in the user geolocation request: ${response.status} ${response.statusText}`);
            }
            const geoData = await response.json();
            setCityFilled(geoData.city)
            weatherForecast(geoData.city)
        } catch (err) {
            setError(err.message)
        }
    }

    async function fetchSuggestions(city) {
        const userName = "mrastartes"
        const url = `https://cors-anywhere.herokuapp.com/http://api.geonames.org/search?q=${city}&maxRows=8&style=LONG&username=${userName}&type=json&fuzzy=0.5&lang=${language}&searchlang=${language}`
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error in the autocomplete request: ${response.status} ${response.statusText}`);
            }
            const suggestionsData = await response.json();
            setSuggestions(suggestionsData.geonames)
        } catch (err) {
            setError(err.message)
        }

    }

    useEffect(() => {
        defineUserGeolocation()
        addToLocalStorageCity()

    }, [])


    useEffect(() => {
        if (city.length < 2) {
            setSuggestions([])
            return
        }
        const debounceTimeout = setTimeout(() => {
            fetchSuggestions(city)
        }, 300)
        return () => {
            clearTimeout(debounceTimeout)
        }

    }, [city])


    const handleInputChange = (event) => {
        setCity(event.target.value)
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (city !== '') {
            await weatherForecast(city)
            addToLocalStorageCity(city)
            setCityFilled(city)
            setCity('')
        } else {
            setError('Enter city name, input field is empty')
        }
    }

    function addToLocalStorageCity(city) {
        let cities = JSON.parse(localStorage.getItem("cities")) || [];
        if (city) {
            const cityIndex = cities.indexOf(city)
            if (cityIndex !== -1) {
                cities.splice(cityIndex, 1)
            }
            cities.unshift(city)
            if (cities.length > 4) {
                cities.pop()
            }
        }
        localStorage.setItem("cities", JSON.stringify(cities))
        setCitiesInLocalStorage(cities)
    }

    const localStorageHandler = (city)=>{
        setCityFilled(city)
        weatherForecast(city)
    }

    function autocompleteHandler(city) {
        setCityFilled(city)
        weatherForecast(city);
        setSuggestions([])
    }

    const handleLanguageChange = (language) => {

        setLanguage(language)
    }
    useEffect(() => {
        if (cityFilled.length > 0) {
            weatherForecast(cityFilled)
        }

    }, [language])

    return (
        <div className="App">
            <LangRadioButtons onLanguageChange={handleLanguageChange}/>
            <div className="App-header">
                <form className="inputForm" onSubmit={handleSubmit}>
                    <input type="text" value={city} onChange={handleInputChange} placeholder={translation[language].input}/>
                    <button type="submit">{translation[language].send}</button>
                </form>
                {suggestions.length > 0 &&
                    <div className="autocompleteList">
                        {suggestions.map((suggestion, index) => (
                            <button key={index} className="autocompleteButton"
                                    onClick={() => autocompleteHandler(suggestion.name)}>
                                <p className="autocompleteCityName">{suggestion.name}</p>
                                <p className="autocompleteCountryName">{suggestion.countryName}</p>
                            </button>
                        ))}
                    </div>
                }
                <div className="localStorageButtons">
                    {citiesInLocalStorage.length !== 0 && citiesInLocalStorage.map((item, index) => (
                        <button className="localStorageButton" onClick={() => localStorageHandler(item)}
                                key={index}>{item}</button>

                    ))}
                </div>
                {error && <div className="errorMessage">{error}</div>}
            </div>


            {loading && <img src={loadingGif} alt="loading..."/>}

            {Object.keys(weatherRightNowData).length !== 0 &&
                <div className="weatherRightNow">
                    <div className="weatherInfo">
                        <div className="cityName">{weatherRightNowData.name}</div>
                        <div className="weatherRightNowIcon">
                            <img className="weatherRightNowIconImg"
                                 src={`https://openweathermap.org/img/wn/${weatherRightNowData.weather[0].icon}@2x.png`}
                                 alt={weatherRightNowData.weather[0].icon}/>
                            <p>{weatherRightNowData.weather[0].description}</p>
                        </div>
                    </div>
                    <div className="weatherTemperature">{Math.round(weatherRightNowData.main.temp)}°C</div>
                    <div className="weatherDescription">
                        <div>{translation[language].feeling} {Math.round(weatherRightNowData.main.feels_like)}°C</div>
                        <div>{translation[language].humidity} {weatherRightNowData.main.humidity}%</div>
                        <div>{translation[language].windSpeed} {weatherRightNowData.wind.speed} meter/sec</div>
                    </div>

                </div>
            }
            {Object.keys(weatherForecastData).length !== 0 &&
                <div className='forecastList'>
                    {dates.map((date, index) => (
                        <ul className='forecastListItem'>
                            <li className='forecastListDateItem' key={index}>{date}</li>
                            {Object.keys(weatherForecastData[date]).reverse().map((time, i) => (
                                <ul>
                                    <li key={i}>{time} - {weatherForecastData[date][time][0]}°C
                                        - {weatherForecastData[date][time][1]}
                                        <img className="weatherIcon"
                                             src={`https://openweathermap.org/img/wn/${weatherForecastData[date][time][2]}@2x.png`}
                                             alt={weatherForecastData[date][time][2]}/>
                                    </li>
                                </ul>

                            ))}
                        </ul>
                    ))}
                </div>
            }
        </div>
    );
}

export default App;
