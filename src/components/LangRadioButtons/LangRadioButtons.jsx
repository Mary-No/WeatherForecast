import {FormControlLabel, Radio, RadioGroup} from "@material-ui/core";
import {useState} from "react";
import './LangRadioButtons.css'

function LangRadioButtons({onLanguageChange}){
    const [language, setLanguage] = useState("eng");
    const handleChange = (event) => {
        setLanguage(event.target.value);
        onLanguageChange(event.target.value);
    }
    return(
        <div className="LangRadioButtonsContainer">
        <RadioGroup className="LangRadioButtons" aria-label="gender" name="gender1" value={language} onChange={handleChange}>
            <FormControlLabel value="eng" control={<Radio />} label="eng" />
            <FormControlLabel value="ru" control={<Radio />} label="ru" />
            <FormControlLabel value="es" control={<Radio />} label="es" />
        </RadioGroup>
        </div>
    )
}

export default LangRadioButtons;