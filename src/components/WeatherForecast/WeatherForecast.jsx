function WeatherForecast({dates, weatherForecastData}) {
    return (
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
    )
}
export default WeatherForecast;