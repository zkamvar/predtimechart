import App from '../predtimechart.js';

const {test} = QUnit;


//
// an options object to work with
//

const covid19ForecastsVizTestOptions = {
    "target_variables": [
        {
            "value": "week_ahead_incident_deaths",
            "text": "week ahead incident deaths",
            "plot_text": "week ahead incident deaths"
        }
    ],
    "initial_target_var": "week_ahead_incident_deaths",
    "units": [
        {"value": "48", "text": "Texas"},
        {"value": "US", "text": "US"}
    ],
    "initial_unit": "48",
    "intervals": ["0%", "50%", "95%"],
    "initial_interval": "95%",
    "available_as_ofs": {
        "week_ahead_incident_deaths": ["2022-01-01", "2022-01-08", "2022-01-15", "2022-01-22", "2022-01-29"]
    },
    "initial_as_of": "2022-01-29",
    "current_date": "2022-01-29",
    "models": ["COVIDhub-ensemble", "COVIDhub-baseline"],
    "initial_checked_models": ["COVIDhub-baseline", "COVIDhub-ensemble"],
    "disclaimer": "Most forecasts have failed to reliably predict rapid changes in the trends of reported cases and hospitalizations. Due to this limitation, they should not be relied upon for decisions about the possibility or timing of rapid changes in trends.",
    "initial_xaxis_range": null
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

QUnit.module('initialize() validation');

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


test('options object available_as_ofs valid', assert => {
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);

    delete optionsCopy['available_as_ofs'];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /available_as_ofs is required but missing/,
    );

    optionsCopy['available_as_ofs'] = null;  // recall that `null` is an `object`
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /available_as_ofs is not an object/,
    );

    optionsCopy['available_as_ofs'] = {};
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /available_as_ofs has no target variable keys/,
    );

    optionsCopy['available_as_ofs'] = {"week_ahead_incident_deaths": null};
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /available_as_ofs target variable value was not an array/,
    );

    optionsCopy['available_as_ofs'] = {"week_ahead_incident_deaths": ["not a yyyy-mm-dd date"]};
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /available_as_ofs target variable value array contained a non-yyyy-mm-dd date/,
    );
});


test('options object current_date valid', assert => {
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);

    delete optionsCopy['current_date'];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /current_date is required but missing/,
    );

    optionsCopy['current_date'] = null;
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /current_date is not a string/,
    );

    optionsCopy['current_date'] = "not a yyyy-mm-dd date";
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /current_date is not a yyyy-mm-dd date/,
    );
});


test('options object disclaimer valid', assert => {
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);

    delete optionsCopy['disclaimer'];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /disclaimer is required but missing/,
    );

    optionsCopy['disclaimer'] = null;
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /disclaimer is not a string/,
    );
});


test('options object initial_as_of valid', assert => {
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);

    delete optionsCopy['initial_as_of'];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_as_of is required but missing/,
    );

    optionsCopy['initial_as_of'] = null;
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_as_of is not a string/,
    );

    optionsCopy['initial_as_of'] = "not a yyyy-mm-dd date";
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_as_of is not a yyyy-mm-dd date/,
    );
});


test('options object models valid', assert => {
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);

    delete optionsCopy['models'];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /models is required but missing/,
    );

    optionsCopy['models'] = null;
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /models is not an array/,
    );

    optionsCopy['models'] = [null];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /models contained a non-string/,
    );
});


test('options object initial_checked_models valid', assert => {
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);

    delete optionsCopy['initial_checked_models'];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_checked_models is required but missing/,
    );

    optionsCopy['initial_checked_models'] = null;
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_checked_models is not an array/,
    );

    optionsCopy['initial_checked_models'] = [null];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_checked_models model not in models/,
    );
});


test('options object intervals valid', assert => {
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);

    delete optionsCopy['intervals'];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /intervals is required but missing/,
    );

    optionsCopy['intervals'] = null;
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /intervals is not an array/,
    );

    optionsCopy['intervals'] = [null];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /intervals contained a non-string/,
    );

    optionsCopy['intervals'] = ["not <integer>% pattern"];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /intervals interval does not match "<integer>%" pattern/,
    );
});


test('options object initial_interval valid', assert => {
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);

    delete optionsCopy['initial_interval'];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_interval is required but missing/,
    );

    optionsCopy['initial_interval'] = null;
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_interval is not a string/,
    );

    optionsCopy['initial_interval'] = "not in intervals";
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_interval not in intervals/,
    );
});


test('options object target_variables valid', assert => {
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);

    delete optionsCopy['target_variables'];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /target_variables is required but missing/,
    );

    optionsCopy['target_variables'] = null;
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /target_variables is not an array/,
    );

    optionsCopy['target_variables'] = [];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /target_variables array contains no objects/,
    );

    optionsCopy['target_variables'] = [null];  // recall that `null` is an `object`
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /target_variables element was not an object/,
    );

    const badTargetVarsExpErrorTuples = [
        [{}, /target_variable does not have expected keys/],                              // missing all three keys
        [{'value': '', 'text': ''}, /target_variable does not have expected keys/],       // missing 'plot_text'
        [{'value': '', 'plot_text': ''}, /target_variable does not have expected keys/],  // "" 'text'
        [{'text': '', 'plot_text': ''}, /target_variable does not have expected keys/],   // "" 'value'
        [{'value': null, 'text': '', 'plot_text': ''}, /target_variable key value is not a string/],  // bad 'value'
        [{'value': '', 'text': null, 'plot_text': ''}, /target_variable key value is not a string/],  // "" 'text'
        [{'value': '', 'text': '', 'plot_text': null}, /target_variable key value is not a string/],  // "" 'plot_text'
    ];
    badTargetVarsExpErrorTuples.forEach((targetVarExpErrorTuple) => {
        const [targetVar, expError] = targetVarExpErrorTuple;
        optionsCopy['target_variables'] = [targetVar];
        assert.throws(
            function () {
                App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
            },
            expError,
        );
    });
});


test('options object initial_target_var valid', assert => {
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);

    delete optionsCopy['initial_target_var'];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_target_var is required but missing/,
    );

    optionsCopy['initial_target_var'] = null;
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_target_var is not a string/,
    );

    optionsCopy['initial_target_var'] = "not in target_variables";
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_target_var not in target_variables/,
    );
});


test('options object units valid', assert => {
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);

    delete optionsCopy['units'];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /units is required but missing/,
    );

    optionsCopy['units'] = null;
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /units is not an array/,
    );

    optionsCopy['units'] = [];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /units array contains no objects/,
    );

    optionsCopy['units'] = [null];  // recall that `null` is an `object`
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /units element was not an object/,
    );

    const badUnitsExpErrorTuples = [
        [{}, /unit does not have expected keys/],             // missing both keys
        [{'value': ''}, /unit does not have expected keys/],  // "" 'text'
        [{'text': ''}, /unit does not have expected keys/],   // "" 'value'
        [{'value': null, 'text': ''}, /unit key value is not a string/],  // bad 'value'
        [{'value': '', 'text': null}, /unit key value is not a string/],  // "" 'text'
    ];
    badUnitsExpErrorTuples.forEach((targetVarExpErrorTuple) => {
        const [targetVar, expError] = targetVarExpErrorTuple;
        optionsCopy['units'] = [targetVar];
        assert.throws(
            function () {
                App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
            },
            expError,
        );
    });
});


// todo xx initial_unit: must be a `value` of one of the `units` objects
test('options object initial_unit valid', assert => {
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);

    delete optionsCopy['initial_unit'];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_unit is required but missing/,
    );

    optionsCopy['initial_unit'] = null;
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_unit is not a string/,
    );

    optionsCopy['initial_unit'] = "not in units";
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_unit not in units/,
    );
});


// todo xx initial_xaxis_range (optional): an array of two date strings in 'YYYY-MM-DD' format
/*
"initial_xaxis_range": ["2022-05-14", "2023-06-24"]
 */
test('options object initial_xaxis_range valid', assert => {
    const optionsCopy = structuredClone(covid19ForecastsVizTestOptions);

    delete optionsCopy['initial_xaxis_range'];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_xaxis_range is required but missing/,
    );

    optionsCopy['initial_xaxis_range'] = -1;
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_xaxis_range is not an array/,
    );

    optionsCopy['initial_xaxis_range'] = [null];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_xaxis_range contained a non-string/,
    );

    optionsCopy['initial_xaxis_range'] = ["not a yyyy-mm-dd date"];
    assert.throws(
        function () {
            App.initialize('qunit-fixture', _fetchData, true, optionsCopy, null);
        },
        /initial_xaxis_range contained a non-yyyy-mm-dd date/,
    );
});
