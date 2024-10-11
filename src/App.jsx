import './css/App.css';
import {useEffect, useRef, useState} from "react";
import loadingGif from "./assets/icons/loadingSVG.svg"
import LangRadioButtons from "./components/LangRadioButtons/LangRadioButtons";
import InputForm from "./components/InputForm/InputForm";
import WeatherNow from "./components/WeatherNow/WeatherNow";
import WeatherForecast from "./components/WeatherForecast/WeatherForecast";
import LocalStorageButtons from "./components/LocalStorageButtons/LocalStorageButtons";
import {
    fetchCityCoordinates,
    fetchCitySuggestions,
    fetchUserGeolocation,
    fetchWeatherForecast,
    fetchWeatherNow
} from "./services/apiService";

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
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const autocompleteRef = useRef(null);


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
            input: 'Introduzca el nombre de la ciudad',
            send: 'Enviar'
        }
    }

    const dateHandler = (date) => {
        // Проверяем, есть ли уже обработанные данные в sessionStorage
        const cachedData = sessionStorage.getItem(date);
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

        try {
            const {lat, lon} = await fetchCityCoordinates(city);
            const weatherRightNowData = await fetchWeatherNow(lat, lon, language);
            const weatherForecastData = await fetchWeatherForecast(city, language);

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
            addToLocalStorageCity(city)
            setCityFilled(city)

        } catch (err) {
            let errorMessage;
            if (err.status) {
                switch (err.status) {
                    case 404: {
                        errorMessage = 'Sorry, there is no data about this city';
                        setWeatherRightNowData({})
                        setWeatherForecastData({})
                        break
                    }
                    case 500: {
                        errorMessage = 'Server error. Try again later';
                        break
                    }
                    case 429: {
                        errorMessage = 'Too many requests. Try again later';
                        break
                    }
                    default:
                        errorMessage = `Unexpected error occurred (Error ${err.status}). Please try again.`;
                        break
                }
            } else if (err.message === 'Failed to fetch') {
                errorMessage = 'Please check your internet connection'
            } else {
                errorMessage = 'An unexpected error occurred. Please try again.'
            }
            setError(errorMessage)
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
        try {
            const geoData = await fetchUserGeolocation();

            // Сохраняем результат в localStorage
            sessionStorage.setItem('userCity', geoData.city);
            setCityFilled(geoData.city)
            weatherForecast(geoData.city)
        } catch (err) {
            setError(err.message)
        }
    }

    async function fetchSuggestions(city) {
        //получаем список городов для автокомплита
        try {
            const suggestionsData = await fetchCitySuggestions(city, language)
            setSuggestions(suggestionsData.geonames)
            if(suggestionsData.geonames.length > 0){
                setIsDropdownVisible(true)
            }else{
                setIsDropdownVisible(false)
            }
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

    const localStorageHandler = (city) => {
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

        const handleClickOutside = (event)=>{
            if(autocompleteRef.current&& !autocompleteRef.current.contains(event.target)){
                setIsDropdownVisible(false)
            }
        }
        document.addEventListener('click', handleClickOutside)

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
                    autocompleteRef={autocompleteRef}
                    isDropdownVisible={isDropdownVisible}
                />

                <LocalStorageButtons cities={citiesInLocalStorage} localStorageHandler={localStorageHandler}/>

                {error && <div className="errorMessage">{error}</div>}
            </div>
            {loading && <img src={loadingGif} alt="loading..."/>}

            {Object.keys(weatherRightNowData).length !== 0 && <WeatherNow weatherRightNowData={weatherRightNowData}
                                                                          translation={translation}
                                                                          language={language}/>}

            {Object.keys(weatherForecastData).length !== 0 && <WeatherForecast weatherForecastData={weatherForecastData}
                                                                               dates={dates}/>
            }
        </div>
    );
}

export default App;
