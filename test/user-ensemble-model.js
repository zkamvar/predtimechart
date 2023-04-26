import _calcUemForecasts from '../user-ensemble-model.js';

const {test} = QUnit;


//
// general tests
//

QUnit.module('general');

const compModelForecasts = {  // from "COVID-19 Forecasts Viz Test" Zoltar project
    "COVIDhub-baseline": {
        "target_end_date": ["2022-02-05", "2022-02-12"],
        "q0.025": [590.675, 446.981771067711],
        "q0.25": [1089.25, 1003.57023320233],
        "q0.5": [1212, 1212],
        "q0.75": [1334.75, 1421.13823138231],
        "q0.975": [1833.325, 1973.59632346323]
    },
    "COVIDhub-ensemble": {
        "target_end_date": ["2022-02-05", "2022-02-12"],
        "q0.025": [738, 801],
        "q0.25": [1111, 1152],
        "q0.5": [1198, 1321],
        "q0.75": [1387, 1494],
        "q0.975": [1727, 1944]
    }
};


test('must have one or more componentModels', assert => {
    assert.throws(
        function () {
            _calcUemForecasts([], {})
        },
        /must have one or more componentModels/,
    );
});


test('some models had no forecast data', assert => {
    assert.throws(
        function () {
            _calcUemForecasts(['model'], {})
        },
        /some models had no forecast data/,
    );
});


test('check all array items are numbers', assert => {
    const forecasts = {
        "COVIDhub-baseline": {
            "target_end_date": ["2022-02-05", "2022-02-12"],
            "q0.025": [590.675, 'a']  // third item not a number
        }
    };
    assert.throws(
        function () {
            _calcUemForecasts(["COVIDhub-baseline"], forecasts)
        },
        /array item was not a number/,
    );
});


test('different quantiles', assert => {
    const forecasts = {
        "COVIDhub-baseline": {
            "target_end_date": ["2022-02-05", "2022-02-12"],
            "q0.025": [590.675, 446.981771067711],
            "q0.25": [1089.25, 1003.57023320233]
        },
        "COVIDhub-ensemble": {
            "target_end_date": ["2022-02-05", "2022-02-12"],
            // "q0.025": missing
            "q0.025": [738, 801]
        }
    };
    assert.throws(
        function () {
            _calcUemForecasts(["COVIDhub-baseline", "COVIDhub-ensemble"], forecasts)
        },
        /not all forecasts had the same quantiles/,
    );
});


//
// following tests five target_end_dates-related cases:
//
// - variable 1: intersection (none, partial, 100%) -> (error, ok, ok)
// - variable 2: length (same, different) -> only depends on variable 1
//
// (NB: last combination is N/A: 100% intersection cannot have different lengths)
//

QUnit.module('target_end_dates');

test('target_end_dates: no intersection, same length', assert => {
    const badForecasts = {
        "COVIDhub-ensemble-bad": {
            "target_end_date": ["2022-02-06", "2022-02-13"],  // COVIDhub-baseline: "2022-02-05", "2022-02-12"
            "q0.025": [0, 0],
            "q0.25": [0, 0],
            "q0.5": [0, 0],
            "q0.75": [0, 0],
            "q0.975": [0, 0]
        }
    };
    const forecasts = {...compModelForecasts, ...badForecasts};
    assert.throws(
        function () {
            _calcUemForecasts(["COVIDhub-baseline", "COVIDhub-ensemble-bad"], forecasts)
        },
        /forecasts had no common target_end_dates/,
    );
});


test('target_end_dates: no intersection, different length', assert => {
    const badForecasts = {
        "COVIDhub-ensemble-bad": {
            "target_end_date": ["2022-02-06"],  // COVIDhub-baseline: "2022-02-05", "2022-02-12"
            "q0.025": [0],
            "q0.25": [0],
            "q0.5": [0],
            "q0.75": [0],
            "q0.975": [0]
        }
    };
    const forecasts = {...compModelForecasts, ...badForecasts};
    assert.throws(
        function () {
            _calcUemForecasts(["COVIDhub-baseline", "COVIDhub-ensemble-bad"], forecasts)
        },
        /forecasts had no common target_end_dates/,
    );
});


test('target_end_dates: partial intersection, same length', assert => {
    // OK: only intersecting target_end_dates returned
    const partialForecasts = {
        "COVIDhub-ensemble-partial": {
            "target_end_date": ["2022-02-05", "2022-02-13"],  // COVIDhub-baseline: "2022-02-05", "2022-02-12"
            "q0.025": [738, 801],
            "q0.25": [1111, 1152],
            "q0.5": [1198, 1321],
            "q0.75": [1387, 1494],
            "q0.975": [1727, 1944]
        }
    };
    const forecasts = {...compModelForecasts, ...partialForecasts};
    const act_forecasts = _calcUemForecasts(["COVIDhub-baseline", "COVIDhub-ensemble-partial"], forecasts);
    const exp_forecasts = {
        "target_end_date": ["2022-02-05"],
        "q0.025": [664.3375],  // [ (590.675 + 738)/2 ], i.e., first column
        "q0.25": [1100.125],
        "q0.5": [1205],
        "q0.75": [1360.875],
        "q0.975": [1780.1625]
    };
    assert.deepEqual(act_forecasts, exp_forecasts);
});


test('target_end_dates: partial intersection, different length', assert => {
    // OK: only intersecting target_end_dates returned
    const partialForecasts = {
        "COVIDhub-ensemble-partial": {
            "target_end_date": ["2022-02-12"],  // COVIDhub-baseline: "2022-02-05", "2022-02-12"
            "q0.025": [801],
            "q0.25": [1152],
            "q0.5": [1321],
            "q0.75": [1494],
            "q0.975": [1944]
        }
    };
    const forecasts = {...compModelForecasts, ...partialForecasts};
    const act_forecasts = _calcUemForecasts(["COVIDhub-baseline", "COVIDhub-ensemble-partial"], forecasts);
    const exp_forecasts = {
        "target_end_date": ["2022-02-12"],
        "q0.025": [623.9908855338555],  // [ (446.981771067711 + 801)/2 ], i.e., second column
        "q0.25": [1077.785116601165],
        "q0.5": [1266.5],
        "q0.75": [1457.569115691155],
        "q0.975": [1958.798161731615]
    };
    assert.deepEqual(act_forecasts, exp_forecasts);
});


test('target_end_dates: one model', assert => {
    // OK: all target_end_dates returned
    const act_forecasts = _calcUemForecasts(["COVIDhub-baseline"], compModelForecasts);
    const exp_forecasts = compModelForecasts["COVIDhub-baseline"];
    assert.deepEqual(act_forecasts, exp_forecasts);
});


test('target_end_dates: 100% intersection, same length, two models', assert => {
    // OK: all target_end_dates returned
    const act_forecasts = _calcUemForecasts(Object.keys(compModelForecasts), compModelForecasts);
    const exp_forecasts = {
        "target_end_date": ["2022-02-05", "2022-02-12"],
        "q0.025": [664.3375, 623.9908855338555],  // [ (590.675 + 738)/2 , (446.981771067711 + 801)/2 ]
        "q0.25": [1100.125, 1077.785116601165],
        "q0.5": [1205, 1266.5],
        "q0.75": [1360.875, 1457.569115691155],
        "q0.975": [1780.1625, 1958.798161731615]
    };
    assert.deepEqual(act_forecasts, exp_forecasts);
});
