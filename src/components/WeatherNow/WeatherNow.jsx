function WeatherNow({weatherRightNowData, translation, language}) {
    return (
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
    )
}
export default WeatherNow