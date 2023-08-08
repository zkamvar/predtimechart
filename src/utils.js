//
// Various utilities for the app.
//

/**
 *
 * @param year {String} date in 'YYYY-MM-DD' format
 * @param availableYears {Array} dates in 'YYYY-MM-DD' format
 * @returns {String} the date in `availableYears` that's closest to `year` ('YYYY-MM-DD' format)
 */
function closestYear(year, availableYears) {
    if (availableYears.length === 0) {
        throw new Error(`availableYears is empty`);
    } else if (availableYears.indexOf(year) !== -1) {  // already in availableYears
        return year;
    }

    // create availableYears as Date objects and then iterate, comparing each with `year` as a Date and tracking the one
    // with the minimum offset. no need to sort
    const yearAsDate = _parseYYYYMMDDStr(year);
    const availYearsDates = availableYears.map(availYear => _parseYYYYMMDDStr(availYear));
    let closestAvailYearDate = null;  // Date
    availYearsDates.forEach(availYearDate => {
        const closestAvailYearDelta = closestAvailYearDate === null ? null : Math.abs(closestAvailYearDate - yearAsDate);
        const availYearDelta = Math.abs(availYearDate - yearAsDate);
        if ((closestAvailYearDate === null) || (availYearDelta < closestAvailYearDelta)) {
            closestAvailYearDate = availYearDate;
        }
    });

    // done
    return closestAvailYearDate.toISOString().split('T')[0];  // convert to 'YYYY-MM-DD' format
}


/**
 * @param year {String} date in 'YYYY-MM-DD' format
 * @returns {Date} `year` as a Date object
 * @private
 */
function _parseYYYYMMDDStr(year) {
    // month -1 -> monthIndex
    return new Date(parseInt(year.slice(0, 4)), parseInt(year.slice(5, 7)) - 1, parseInt(year.slice(8, 10)));
}


/**
 * Validates modelName
 *
 * @param models array of current models
 * @param modelName candidate name for USER_ENSEMBLE_MODEL.name
 * @returns error message if invalid; false if valid: <= 31 chars . letter, number, underscore, or hyphen/dash
 * @private
 */
function _isInvalidUemName(models, modelName) {
    if (modelName.length === 0) {
        return "name is required";
    } else if (modelName.length > 31) {
        return "name is more than 31 characters";
    } else if (models.includes(modelName)) {
        return "name already used";
    } else if (!(/^[a-zA-Z0-9_-]+$/.test(modelName))) {
        return "name had invalid characters. must be letters, numbers, underscores, or hypens'";
    } else {
        return false;  // valid
    }
}


//
// saveFile() helper for $("#downloadUserEnsemble").click()
// - per https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
//

function download(content, mimeType, filename) {
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        const a = document.createElement('a')
        document.body.appendChild(a);
        const blob = new Blob([content], {type: mimeType}) // Create a blob (file-like object)
        const url = URL.createObjectURL(blob)
        a.setAttribute('href', url)
        a.setAttribute('download', filename)
        a.click()  // Start downloading
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 0)
    }
}


// export

export {closestYear, _isInvalidUemName, download}
