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


// export

export {closestYear}
