/**
 * Computes an ensemble model's forecasts based on component models. NB: Assumes inputs are consistent, i.e., every
 * model in `componentModels` has a key in `forecasts`, and every value in `forecasts` is structured correctly as
 * documented at https://github.com/reichlab/predtimechart/ , i.e., has these keys: "target_end_date", "q0.025",
 * "q0.25", "q0.5", "q0.75", and "q0.975". The output has these same keys. Algorithm: Uses mean. Note that this function
 * throws an Error on invalid inputs.
 *
 # @param {Array} componentModels - array of Strings naming the models to create the ensemble from
 # @param {Object} forecasts - forecasts containing data for componentModels. same format as App.state.forecasts
 # @return {Object} forecasts - ensemble forecasts. same format as `forecasts`
 */
function _calcUemForecasts(componentModels, forecasts) {
    // validate: must have one or more componentModels
    if (componentModels.length === 0) {
        throw new Error(`_calcUemForecasts(): must have one or more componentModels`);
    }

    // validate: all models must have forecast data
    const modelsWithNoForecasts = [];
    componentModels.forEach((model) => {
        if (!Object.hasOwn(forecasts, model)) {
            modelsWithNoForecasts.push(model);
        }
    });
    if (modelsWithNoForecasts.length !== 0) {
        throw new Error(`_calcUemForecasts(): some models had no forecast data: ${modelsWithNoForecasts}`);
    }

    // validate: all forecasts must have the same quantiles
    const quantilesSet = new Set(componentModels.map(model => JSON.stringify(Object.keys(forecasts[model]))));
    if (quantilesSet.size !== 1) {
        throw new Error(`not all forecasts had the same quantiles: ${JSON.stringify([...quantilesSet])}`);
    }

    // validate: forecasts' target_end_dates must have at least one date in common (i.e., the intersection must not be
    // empty). set intersection per https://stackoverflow.com/questions/55053007/intersection-of-n-sets
    const target_end_dates_sets = [];  // target_end_date sets, one per model. filled next
    componentModels.forEach((model) => {
        target_end_dates_sets.push(new Set(forecasts[model]['target_end_date']));
    });
    const target_end_dates_intersect = target_end_dates_sets.reduce((a, b) => new Set([...a].filter(x => b.has(x))));
    if (target_end_dates_intersect.size === 0) {
        throw new Error(`_calcUemForecasts(): forecasts had no common target_end_dates`);
    }

    // compute target_end_date intersection indices for each model
    const modelToTEDIndices = {};
    componentModels.forEach((model) => {
        modelToTEDIndices[model] = [...target_end_dates_intersect].map(
            (targetEndDate) => forecasts[model]['target_end_date'].indexOf(targetEndDate));
    });

    // iterate over quantiles (keys that begin with 'q0.'), computing the mean and saving in ensembleForecasts.
    // NB: assumes all forecasts have the same quantiles.
    const firstModelForecasts = forecasts[componentModels[0]];
    const ensembleForecasts = {'target_end_date': [...target_end_dates_intersect]};  // return value. filled next
    Object.keys(firstModelForecasts).forEach((key) => {
        if (key.startsWith('q0.')) {  // quantile key, e.g., 'q0.025'
            const allModelsQuantiles = [];  // filled next
            componentModels.forEach((model) => {
                const modelForecasts = forecasts[model][key];
                const indexedModelForecasts = modelToTEDIndices[model].map(i => modelForecasts[i]);
                allModelsQuantiles.push(indexedModelForecasts);
            });
            ensembleForecasts[key] = _arraysMean(allModelsQuantiles);
        }
    });

    // done
    return ensembleForecasts
}


/**
 * Calculates an array of the same length as each array in quantileArrays (assumes they are all the same length) whose
 * elements are the arithmetic mean of the indexed values. For example, if called with these two arrays:
 * [590.675, 446.981771067711] , [738, 801] -> [mean([590.675, 738]), mean([446.981771067711, 801])]
 *
 * @param quantileArrays {array} - an array of numeric arrays, all the same length
 * @returns {array} - an array that's the arithmetic mean of the indexed values
 * @private
 */
function _arraysMean(quantileArrays) {
    // check quantileArrays all the same length
    const lengthSet = new Set(quantileArrays.map(element => element.length));
    if (lengthSet.size !== 1) {
        throw new Error(`quantileArrays not all the same length: ${quantileArrays}`);
    }

    const meanArray = [];  // return value. filled next
    for (let idx = 0; idx < lengthSet.values().next().value; idx++) {  // numQuantiles
        const meanArrayForIdx = [];  // filled next
        quantileArrays.forEach((quantileArray) => {
            meanArrayForIdx.push(quantileArray[idx]);
        });
        const mean = _arrayMean(meanArrayForIdx);
        meanArray.push(mean)
    }

    // done
    return meanArray;
}


/**
 * @param {array} array - an array of numbers
 * @returns {number} - the mean of `array`'s elements
 * @private
 */
function _arrayMean(array) {
    var total = 0;
    array.forEach((value) => {
        if (typeof (value) !== 'number') {
            throw new Error(`array item was not a number: ${value}`);
        }
        total += value;
    });
    return total / array.length;
}


export default _calcUemForecasts;
