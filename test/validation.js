import './stubs.js'
import App from '../src/predtimechart.js';

const {test} = QUnit;


//
// an options object to work with
//

const covid19ForecastsVizTestOptions = {
    "available_as_ofs": {
        "week_ahead_incident_deaths": ["2022-01-01", "2022-01-08", "2022-01-15", "2022-01-22", "2022-01-29"]
    },
    "current_date": "2022-01-29",
    "disclaimer": "Most forecasts have failed to reliably predict rapid changes in the trends of reported cases and hospitalizations. Due to this limitation, they should not be relied upon for decisions about the possibility or timing of rapid changes in trends.",
    "initial_as_of": "2022-01-29",
    "initial_checked_models": ["COVIDhub-baseline", "COVIDhub-ensemble"],
    "initial_interval": "95%",
    "initial_target_var": "week_ahead_incident_deaths",
    "initial_unit": "48",
    "initial_xaxis_range": null,
    "intervals": ["0%", "50%", "95%"],
    "models": ["COVIDhub-ensemble", "COVIDhub-baseline"],
    "target_variables": [{
        "value": "week_ahead_incident_deaths",
        "text": "week ahead incident deaths",
        "plot_text": "week ahead incident deaths"
    }],
    "units": [{"value": "48", "text": "Texas"}, {"value": "US", "text": "US"}],
};


//
// initialize() function placeholders
//

function _fetchData(...args) {
}


// prevent initialize() from trying to get data
App.fetchDataUpdatePlot = function (...args) {
};


//
// initialize() validation tests
//

QUnit.module('initialize() basic structural validation');

test('componentDiv not found', assert => {
    assert.throws(
        function () {
            App.initialize('bad-div', null, true, covid19ForecastsVizTestOptions, null);
        },
        /componentDiv DOM node not found/,
    );
});


test('options object missing', assert => {
    assert.throws(
        function () {
            App.initialize('qunit-fixture', null, true, null, null);
        },
        /options object is required but missing/,
    );
});


test('options object blue sky', assert => {
    // per https://stackoverflow.com/questions/9822400/how-to-assert-that-a-function-does-not-raise-an-exception
    App.initialize('qunit-fixture', null, true, covid19ForecastsVizTestOptions, null);
    assert.ok(true, "no Error raised");
});


QUnit.module('initialize() options object other structural validation');

test('available_as_ofs at least one key', assert => {  // structure test 1/1
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);
    optionsCopy['available_as_ofs'] = {};
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /invalid options structure.*available_as_ofs.*"must NOT have fewer than 1 properties/,
    );
});


QUnit.module('initialize() options object semantics validation');

test('available_as_ofs keys in target_variables value', assert => {  // semantics test 1/6
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);
    optionsCopy['available_as_ofs'] = {"bad key": ["2021-01-01"]};
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /available_as_ofs key not in target_variables value/,
    );
});


test('initial_as_of in available_as_ofs array', assert => {  // semantics test 2/6
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);
    optionsCopy['initial_as_of'] = "2021-01-01";
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_as_of not in available_as_ofs/,
    );
});


test('initial_checked_models in models', assert => {  // semantics test 3/6
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);
    optionsCopy['initial_checked_models'] = [null];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_checked_models model not in models/,
    );
});


test('initial_interval in intervals', assert => {  // semantics test 4/6
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);
    optionsCopy['initial_interval'] = "not in intervals";
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_interval not in intervals/,
    );
});


test('initial_target_var in target_variables values', assert => {  // semantics test 5/6
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);
    optionsCopy['initial_target_var'] = "not in target_variables";
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_target_var not in target_variables/,
    );
});


test('initial_unit in units value', assert => {  // semantics test 6/6
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);
    optionsCopy['initial_unit'] = "not in units";
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_unit not in units/,
    );
});
