//
// _validateOptions() (initialize() helper)
//

// _validateOptions() helper. per https://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}


// _validateOptions() helper that validates `optionName`
function _validateDateOption(options, optionName) {
    if (!Object.hasOwn(options, optionName)) {
        throw `${optionName} is required but missing`;
    }

    const optionValue = options[optionName];
    if (typeof optionValue !== 'string') {
        throw `${optionName} is not a string: ${typeof optionValue}`;
    }

    const optionDateObj = new Date(optionValue);
    if (!isValidDate(optionDateObj)) {
        throw `${optionName} is not a yyyy-mm-dd date: ${optionDateObj}`;
    }
}


// _validateOptions() helper. per https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript
function _isScalarArraysEqual(array1, array2) {
    const array2Sorted = array2.slice().sort();
    return array1.length === array2.length && array1.slice().sort().every(
        function (value, index) {
            return value === array2Sorted[index];
        });
}


/**
 * Validates an initialize() options object.
 *
 * @param {Object} options - visualization initialization options as documented at https://docs.zoltardata.com/visualizationoptionspage/
 * @throws {Error} - if invalid
 * @private
 */
function _validateOptions(options) {
    // options object: must be present
    if ((options === null) || (typeof options !== "object")) {
        throw `options object is required but missing: '${options}'`;
    }

    // `available_as_ofs`: an object with 1+ string keys each with a value of an array of date strings in `yyyy-mm-dd`
    // format
    if (!Object.hasOwn(options, 'available_as_ofs')) {
        throw `available_as_ofs is required but missing`;
    }

    const available_as_ofs = options['available_as_ofs'];
    if ((available_as_ofs === null) || (typeof available_as_ofs !== "object")) {
        throw `available_as_ofs is not an object: '${typeof available_as_ofs}'`;
    }

    if (Object.keys(available_as_ofs).length === 0) {
        throw `available_as_ofs has no target variable keys`;
    }

    Object.keys(available_as_ofs).forEach((key) => {
        const targetVal = available_as_ofs[key];
        if (!Array.isArray(targetVal)) {
            throw `available_as_ofs target variable value was not an array. key=${key}, value=${targetVal}`;
        }

        // validate dates
        targetVal.forEach((maybeDateStr) => {
            if (!isValidDate(new Date(maybeDateStr))) {
                throw `available_as_ofs target variable value array contained a non-yyyy-mm-dd date: ${maybeDateStr}`;
            }
        });
    });

    // `current_date`: a date string in `yyyy-mm-dd` format
    _validateDateOption(options, 'current_date');

    // disclaimer: a string
    if (!Object.hasOwn(options, 'disclaimer')) {
        throw `disclaimer is required but missing`;
    }

    const disclaimer = options['disclaimer'];
    if (typeof disclaimer !== 'string') {
        throw `disclaimer is not a string: ${typeof disclaimer}`;
    }

    // `initial_as_of`: a date string in `yyyy-mm-dd` format
    _validateDateOption(options, 'initial_as_of');

    // `models`: an array of 1+ strings (must be validated before `initial_checked_models`)
    if (!Object.hasOwn(options, 'models')) {
        throw `models is required but missing`;
    }

    const models = options['models'];
    if (!Array.isArray(models)) {
        throw `models is not an array: ${typeof models}`;
    }

    models.forEach((model) => {
        if (typeof model !== 'string') {
            throw `models contained a non-string: ${model}`;
        }
    });

    // `initial_checked_models`: an array of 0+ strings in options['models']
    if (!Object.hasOwn(options, 'initial_checked_models')) {
        throw `initial_checked_models is required but missing`;
    }

    const initialCheckedModels = options['initial_checked_models'];
    if (!Array.isArray(initialCheckedModels)) {
        throw `initial_checked_models is not an array: ${typeof initialCheckedModels}`;
    }

    initialCheckedModels.forEach((model) => {
        if (!models.includes(model)) {
            throw `initial_checked_models model not in models: ${model}`;
        }
    });

    // `intervals`: an array of 1+ strings each being of the form "<integer>%" (e.g., "50%") (must be validated before
    // `initial_interval`)
    if (!Object.hasOwn(options, 'intervals')) {
        throw `intervals is required but missing`;
    }

    const intervals = options['intervals'];
    if (!Array.isArray(intervals)) {
        throw `intervals is not an array: ${typeof intervals}`;
    }

    intervals.forEach((interval) => {
        function isGE0Int(maybeIntStr) {  // per https://sabe.io/blog/javascript-check-string-positive-integer
            const number = Number(maybeIntStr);
            return Number.isInteger(number) && (number >= 0)
        }

        if (typeof interval !== 'string') {
            throw `intervals contained a non-string: ${interval}`;
        }

        const split = interval.split('%');
        if (split.length !== 2) {  // "50%".split('%') -> [ "50", "" ]
            throw `intervals interval does not match "<integer>%" pattern: %: ${interval}`;
        } else if (!isGE0Int(split[0])) {
            throw `intervals interval does not match "<integer>%" pattern: int: ${interval}`;
        }
    });

    // `initial_interval`: a string that must be in `intervals`
    if (!Object.hasOwn(options, 'initial_interval')) {
        throw `initial_interval is required but missing`;
    }

    const initialInterval = options['initial_interval'];
    if (typeof initialInterval !== 'string') {
        throw `initial_interval is not a string: ${typeof disclaimer}`;
    }

    if (!intervals.includes(initialInterval)) {
        throw `initial_interval not in intervals: ${initialInterval}`;
    }

    // `target_variables`: array of 1+ objects, each w/ three keys: 'value', 'text', plot_text'. all values are strings
    if (!Object.hasOwn(options, 'target_variables')) {
        throw `target_variables is required but missing`;
    }

    const targetVariables = options['target_variables'];
    if (!Array.isArray(targetVariables)) {
        throw `target_variables is not an array`;
    }

    if (targetVariables.length === 0) {
        throw `target_variables array contains no objects`;
    }

    targetVariables.forEach((targetVariable) => {
        if ((targetVariable === null) || (typeof targetVariable !== "object")) {
            throw `target_variables element was not an object: '${targetVariable}'`;
        }

        if (!_isScalarArraysEqual(Object.keys(targetVariable), ["value", "text", "plot_text"])) {
            throw `target_variable does not have expected keys: ${JSON.stringify(targetVariable)}`;
        }

        if ((typeof targetVariable['value'] !== 'string') ||
            (typeof targetVariable['text'] !== 'string') ||
            (typeof targetVariable['plot_text'] !== 'string')) {
            throw `target_variable key value is not a string: ${JSON.stringify(targetVariable)}`;
        }

    });

    // initial_target_var: a string that must be a `value` of one of the `target_variables` objects
    if (!Object.hasOwn(options, 'initial_target_var')) {
        throw `initial_target_var is required but missing`;
    }

    const initialTargetVar = options['initial_target_var'];
    if (typeof initialTargetVar !== 'string') {
        throw `initial_target_var is not a string: ${typeof disclaimer}`;
    }

    const targetVarValues = targetVariables.map((targetVariable) => targetVariable['value']);
    if (!targetVarValues.includes(initialTargetVar)) {
        throw `initial_target_var not in target_variables: ${initialTargetVar}`;
    }

    // units: : an array of objects, each w/ two keys: 'value', 'text'. all values are strings
    if (!Object.hasOwn(options, 'units')) {
        throw `units is required but missing`;
    }

    const units = options['units'];
    if (!Array.isArray(units)) {
        throw `units is not an array`;
    }

    if (units.length === 0) {
        throw `units array contains no objects`;
    }

    units.forEach((unit) => {
        if ((unit === null) || (typeof unit !== "object")) {
            throw `units element was not an object: '${unit}'`;
        }

        if (!_isScalarArraysEqual(Object.keys(unit), ["value", "text"])) {
            throw `unit does not have expected keys: ${JSON.stringify(unit)}`;
        }

        if ((typeof unit['value'] !== 'string') ||
            (typeof unit['text'] !== 'string')) {
            throw `unit key value is not a string: ${JSON.stringify(unit)}`;
        }

    });

    // initial_unit: a string that must be a `value` of one of the `units` objects
    if (!Object.hasOwn(options, 'initial_unit')) {
        throw `initial_unit is required but missing`;
    }

    const initialUnit = options['initial_unit'];
    if (typeof initialUnit !== 'string') {
        throw `initial_unit is not a string: ${typeof disclaimer}`;
    }

    const unitValues = units.map((unit) => unit['value']);
    if (!unitValues.includes(initialUnit)) {
        throw `initial_unit not in units: ${initialUnit}`;
    }

    // initial_xaxis_range (optional if null): an array of two date strings in 'YYYY-MM-DD' format
    if (!Object.hasOwn(options, 'initial_xaxis_range')) {
        throw `initial_xaxis_range is required but missing`;
    }

    const initialXaxisRange = options['initial_xaxis_range'];
    if (initialXaxisRange !== null) {
        if (!Array.isArray(initialXaxisRange)) {
            throw `initial_xaxis_range is not an array: ${typeof initialXaxisRange}`;
        }

        initialXaxisRange.forEach((maybeDateStr) => {
            if (typeof maybeDateStr !== 'string') {
                throw `initial_xaxis_range contained a non-string: ${maybeDateStr}`;
            }

            if (!isValidDate(new Date(maybeDateStr))) {
                throw `available_as_ofsinitial_xaxis_range contained a non-yyyy-mm-dd date: ${maybeDateStr}`;
            }
        });
    }
}


export default _validateOptions;
