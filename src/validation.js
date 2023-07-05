import validate from './schema-validator.cjs'; // Ajs standalone validation code


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

    // validate structure based on JSON Schema using Ajv-compiled validation function
    const valid = validate(options);
    if (!valid) {
        console.error(`_validateOptions(): invalid schema. ${validate.errors.length} error(s). options:, errors:`,
            options, validate.errors);
        // use a long, somewhat unreadable error string so that users (and tests) can get a clue to the problem
        const errorStr = validate.errors.map(errorObj => JSON.stringify(errorObj)).join(', ');
        throw `invalid options structure: ${errorStr}`;
    }

    // validate non-schema (i.e., semantic) constraints.
    // semantics test 1/6: available_as_ofs keys in target_variables value
    const availableAsOfs = options['available_as_ofs'];
    const targetVariables = options['target_variables'];
    Object.keys(availableAsOfs).forEach(availableAsOfKey => {
        let keyWasPresent = false;
        targetVariables.forEach(targetVariable => {
            if (targetVariable.value === availableAsOfKey) {
                keyWasPresent = true;
            }
        });
        if (!keyWasPresent) {
            throw `available_as_ofs key not in target_variables value. key=${availableAsOfKey}`;
        }
    });

    // semantics test 3/6: initial_checked_models in models
    const models = options['models'];
    options['initial_checked_models'].forEach(model => {
        if (!models.includes(model)) {
            throw `initial_checked_models model not in models: ${model}`;
        }
    });

    // semantics test 4/6: initial_interval in intervals
    const initialInterval = options['initial_interval'];
    if (!options['intervals'].includes(initialInterval)) {
        throw `initial_interval not in intervals: ${initialInterval}`;
    }

    // semantics test 5/6: initial_target_var in target_variables values
    const targetVarValues = targetVariables.map((targetVariable) => targetVariable['value']);
    const initialTargetVar = options['initial_target_var'];
    if (!targetVarValues.includes(initialTargetVar)) {
        throw `initial_target_var not in target_variables: ${initialTargetVar}`;
    }

    // semantics test 2/6: initial_as_of in available_as_ofs array. NB: this test must come after 5/6 b/c here we
    // depend on initial_target_var being valid
    const initialAsOf = options['initial_as_of'];
    const initialTargetVarAvailAsOfs = availableAsOfs[initialTargetVar];
    if (!initialTargetVarAvailAsOfs.includes(initialAsOf)) {
        throw `initial_as_of not in available_as_ofs: ${initialAsOf}`;
    }

    // semantics test 6/6: initial_unit in units value
    const units = options['units'];
    const initialUnit = options['initial_unit'];
    const unitValues = units.map((unit) => unit['value']);
    if (!unitValues.includes(initialUnit)) {
        throw `initial_unit not in units: ${initialUnit}`;
    }
}


export default _validateOptions;
