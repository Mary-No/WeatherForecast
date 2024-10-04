import './css/App.css';
import {useEffect, useState} from "react";
import loadingGif from "./assets/icons/loadingSVG.svg"

function App() {

    const [weatherRightNowData, setWeatherRightNowData] = useState({});
    const [weatherForecastData, setWeatherForecastData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dates, setDates] = useState([]);
    const [city, setCity] = useState('');
    const [citiesInLocalStorage, setCitiesInLocalStorage] = useState([]);

    function dateHandler(date) {
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
                throw new Error('Город не найден')
            }
            const lat = geoData[0].lat;
            const lon = geoData[0].lon;

            // Используя ширину и долготу, получить информацию о погоде в данный момент
            const url_weather = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_key}&units=metric`
            const weatherResponse = await fetch(url_weather);
            if (!weatherResponse.ok) {
                throw new Error(`Error in current weather request : ${weatherResponse.status} `);
            }
            const weatherRightNowData = await weatherResponse.json();
            setWeatherRightNowData(weatherRightNowData)

        } catch (err) {
            setError(err.message);
        }
        try {
            // Получить прогноз погоды на ближайшие 5 дней
            const url_weather_forecast = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_key}&units=metric`
            const weatherForecastResponse = await fetch(url_weather_forecast);
            if (!weatherForecastResponse.ok) {
                throw new Error(`Error in the weather forecast request : ${weatherForecastResponse.status} `);
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
            setWeatherForecastData(temperatureForecastByDate)

        } catch (err) {
            setError(err.message);
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
            weatherForecast(geoData.city)
            console.log(geoData)
        } catch (err) {
            setError(err.message)
        }
    }

    useEffect(() => {
        defineUserGeolocation()
    }, [])

    const handleInputChange = (event) => {
        setCity(event.target.value)
    }
    const handleSubmit = async (event) => {
        event.preventDefault()
        if (city !== '') {
            await weatherForecast(city)
            addToLocalStorageCity(city)
            setCity('')
        } else {
            setError('Enter city name, input field is empty')
        }
    }

    function addToLocalStorageCity(city) {
        let cities = JSON.parse(localStorage.getItem("cities")) || [];
        const cityIndex = cities.indexOf(city)
        if (cityIndex !== -1) {
            cities.splice(cityIndex, 1)
        }
        cities.unshift(city)
        if (cities.length > 4) {
            cities.pop()
        }
        localStorage.setItem("cities", JSON.stringify(cities))
        setCitiesInLocalStorage(cities)
    }


    return (
        <div className="App">
            <div className="App-header">
                <form className="inputForm" onSubmit={handleSubmit}>
                    <input type="text" value={city} onChange={handleInputChange} placeholder="Enter the city name"/>
                    <button type="submit">Send</button>
                </form>
                <div className="localStorageButtons">
                {citiesInLocalStorage.length!==0 && citiesInLocalStorage.map((item, index) => (
                    <button className="localStorageButton" onClick={()=>weatherForecast(item)} key={index}>{item}</button>
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
                        <div>Feels like: {Math.round(weatherRightNowData.main.feels_like)}°C</div>
                        <div>Humidity: {weatherRightNowData.main.humidity}%</div>
                        <div>Wind speed: {weatherRightNowData.wind.speed} meter/sec</div>
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
