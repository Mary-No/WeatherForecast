import React from "react";

function LocalStorageButtons({cities, localStorageHandler}) {
    return (
        <div className="localStorageButtons">
            {cities.length !== 0 && cities.map((item, index) => (
                <button className="localStorageButton" onClick={() => localStorageHandler(item)}
                        key={index}>{item}</button>

            ))}
        </div>
    )
}

export default React.memo(LocalStorageButtons);