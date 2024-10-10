function InputForm({ city, onInputChange, onSubmit, placeholderText, buttonText, suggestions, onSuggestionClick }) {

    return (
        <div>
        <form className="inputForm" onSubmit={onSubmit}>
            <input type="text" value={city} onChange={onInputChange} placeholder={placeholderText}/>
            <button type="submit">{buttonText}</button>
        </form>
            {suggestions.length > 0 &&
                <div className="autocompleteList">
                    {suggestions.map((suggestion, index) => (
                        <button key={index} className="autocompleteButton"
                                onClick={() => onSuggestionClick(suggestion.name)}>
                            <p className="autocompleteCityName">{suggestion.name}</p>
                            <p className="autocompleteCountryName">{suggestion.countryName}</p>
                        </button>
                    ))}
                </div>
            }
        </div>

    )
}
export default InputForm