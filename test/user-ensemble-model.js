import _calcUemForecasts from '../user-ensemble-model.js';

const {test} = QUnit;

// QUnit.module('Group A');

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


test('not all forecasts had the same target_end_dates', assert => {
    const badForecasts = {
        "COVIDhub-ensemble-bad": {
            "target_end_date": ["2022-02-05", "2022-02-22"],  // last was 2022-02-12
            "q0.025": [738, 801],
            "q0.25": [1111, 1152],
            "q0.5": [1198, 1321],
            "q0.75": [1387, 1494],
            "q0.975": [1727, 1944]
        }
    };
    const forecasts = {...compModelForecasts, ...badForecasts};
    assert.throws(
        function () {
            _calcUemForecasts(["COVIDhub-baseline", "COVIDhub-ensemble-bad"], forecasts)
        },
        /not all forecasts had the same target_end_dates/,
    );
});


test('quantileArrays not all the same length', assert => {
    const forecasts = {
        "COVIDhub-baseline": {
            "target_end_date": ["2022-02-05", "2022-02-12"],
            "q0.025": [590.675, 446.981771067711]
        },
        "COVIDhub-ensemble": {
            "target_end_date": ["2022-02-05", "2022-02-12"],
            "q0.025": [738, 801, -1]  // third item extra
        }
    };
    assert.throws(
        function () {
            _calcUemForecasts(["COVIDhub-baseline", "COVIDhub-ensemble"], forecasts)
        },
        /quantileArrays not all the same length/,
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


test('one model', assert => {
    const act_forecasts = _calcUemForecasts(["COVIDhub-baseline"], compModelForecasts);
    const exp_forecasts = compModelForecasts["COVIDhub-baseline"];
    assert.deepEqual(act_forecasts, exp_forecasts);
});


test('two models', assert => {
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
