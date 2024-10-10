import './css/App.css';
import {useEffect, useState} from "react";
import loadingGif from "./assets/icons/loadingSVG.svg"
import LangRadioButtons from "./components/LangRadioButtons/LangRadioButtons";
import InputForm from "./components/InputForm/InputForm";
import WeatherNow from "./components/WeatherNow/WeatherNow";
import WeatherForecast from "./components/WeatherForecast/WeatherForecast";
import LocalStorageButtons from "./components/LocalStorageButtons/LocalStorageButtons";

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
        // Проверяем, есть ли уже обработанные данные в sessionStorage
        const cachedData = sessionStorage.getItem(date);
        debugger
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        // разделяем дату и время
        const [datePart, timePart] = date.split(" ")
        // меняем формат времени
        const [year, month, day] = datePart.split("-")
        const formattedDate = `${day}.${month}.${year}`
        //убираем секунды во времени
        const formattedTime = timePart.slice(0, 5)
        const result = {date: formattedDate, time: formattedTime}

        // Сохраняем результат в sessionStorage
        sessionStorage.setItem(date, JSON.stringify(result));

        return result;
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

        const cachedCity = sessionStorage.getItem('userCity');
        if (cachedCity) {
            // Если данные есть, используем их и не делаем запрос
            setCityFilled(cachedCity);
            weatherForecast(cachedCity);
            return;
        }
        const API_key = "310595828dc44fea862411b9cab9f11d"
        const url = `https://api.ipgeolocation.io/ipgeo?apiKey=${API_key}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error in the user geolocation request: ${response.status} ${response.statusText}`);
            }
            const geoData = await response.json();

            // Сохраняем результат в localStorage
            sessionStorage.setItem('userCity', geoData.city);
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
        addToLocalStorageCity(city)
    }

    const handleLanguageChange = (language) => {
        setLanguage(language)
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

    useEffect(() => {
        if (cityFilled.length > 0) {
            weatherForecast(cityFilled)
        }

    }, [language])

    return (
        <div className="App">
            <LangRadioButtons onLanguageChange={handleLanguageChange}/>
            <div className="App-header">
                <InputForm
                    city={city}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    placeholderText={translation[language].input}
                    buttonText={translation[language].send}
                    suggestions={suggestions}
                    onSuggestionClick={autocompleteHandler}
                />

                <LocalStorageButtons cities={citiesInLocalStorage} localStorageHandler={localStorageHandler}/>

                {error && <div className="errorMessage">{error}</div>}
            </div>
            {loading && <img src={loadingGif} alt="loading..."/>}

            {Object.keys(weatherRightNowData).length !== 0 && <WeatherNow weatherRightNowData={weatherRightNowData}
                                                                          translation={translation}
                                                                          language={language} /> }

            {Object.keys(weatherForecastData).length !== 0 && <WeatherForecast weatherForecastData={weatherForecastData}
                                                                               dates={dates} />
            }
        </div>
    );
}

export default App;
