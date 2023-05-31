import App from '../predtimechart.js';

const {test} = QUnit;


//
// options DIV tests
//

QUnit.module('options DIV');

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

test('initialize() creates SELECTs', assert => {
    function _fetchData(...args) {
    }

    // prevent initialize() from trying to get data
    App.fetchDataUpdatePlot = function (...args) {
    };

    // componentDiv, _fetchData, isIndicateRedraw, options, _calcUemForecasts:
    App.initialize('qunit-fixture', _fetchData, true, covid19ForecastsVizTestOptions, null);

    // test that options SELECTs were created
    ["target_variable", "unit", "intervals"].forEach((selectId) => {
        // const $select = $(`#${selectId}`);
        // assert.equal($select.length, 1);
        const selectEle = document.getElementById(selectId);
        assert.true(selectEle !== null);
    });
});
