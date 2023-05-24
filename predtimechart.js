/**
 * predtimechart: A JavaScript (ES6 ECMAScript) module for forecast visualization.
 */

import {closestYear} from "./utils.js";
import _calcUemForecasts from './user-ensemble-model.js';


//
// user ensemble model (UEM) functions
//

const USER_ENSEMBLE_MODEL = {  // contains all information about the model
    name: 'User-Ensemble',  // must be a valid name, e.g., no spaces, commas, etc.
    models: [],             // list of model names making up current UEM when it was added by addUserEnsembleModel()
    lastError: null        // Error from last call to _calcUemForecasts()
}


/**
 * Validates modelName
 *
 * @param modelName candidate name for USER_ENSEMBLE_MODEL.name
 * @returns error message if invalid; false if valid: <= 31 chars . letter, number, underscore, or hyphen/dash
 * @private
 */
function _isInvalidUemName(modelName) {
    if (modelName.length === 0) {
        return "name is required";
    } else if (modelName.length > 31) {
        return "name is more than 31 characters";
    } else if (App.state.models.includes(modelName)) {
        return "name already used";
    } else if (!(/^[a-zA-Z0-9_-]+$/.test(modelName))) {
        return "name had invalid characters. must be letters, numbers, underscores, or hypens'";
    } else {
        return false;  // valid
    }
}


/**
 * Updates the user ensemble model's error icon in the models list based on USER_ENSEMBLE_MODEL.lastError .
 *
 * @private
 */
function _updateUemErrorIcon() {
    const error = USER_ENSEMBLE_MODEL.lastError;
    const $modelCheckboxParent = $(`#${USER_ENSEMBLE_MODEL.name}`).parent();  // the <label> - see _selectModelDiv()
    if (error === null) {
        $modelCheckboxParent.children('img').remove();
    } else {
        const imgSrc = "https://github.githubassets.com/images/icons/emoji/unicode/26a0.png";
        const $img = $(
            `<img src="${imgSrc}" title="${error}" alt="${error}"\n` +
            `    class="align-baseline" style="height: 16px; width: 16px; display: inline-block;" >`
        );
        $modelCheckboxParent.after('&nbsp;', $img);
    }
}


//
// helper functions
//

// `updateModelsList()` helper
function _selectModelDiv(model, modelColor, isEnabled, isChecked) {
    const checked = isChecked ? 'checked' : '';
    return `<div class="form-group form-check"
                 style="margin-bottom: 0${!isEnabled ? '; color: lightgrey' : ''}">
                <label>
                    <input type="checkbox" id="${model}" class="model-check" ${checked}>
                    &nbsp;${model}
                    &nbsp;<span class="forecastViz_dot" style="background-color: ${modelColor}; "></span>
                </label>
            </div>`;
}


// event handler helper
function _setSelectedTruths() {
    const isCurrTruthChecked = $("#forecastViz_Current_Truth").prop('checked');
    const isAsOfTruthChecked = $("#forecastViz_Truth_as_of").prop('checked');  // ""
    const selectedTruths = [];
    if (isCurrTruthChecked) {
        selectedTruths.push('Current Truth');
    }
    if (isAsOfTruthChecked) {
        selectedTruths.push('Truth as of');
    }
    this.state.selected_truth = selectedTruths;
    this.fetchDataUpdatePlot(false, null, true);
}


/**
 * `initialize()` helper that builds UI by adding DOM elements to $componentDiv. the UI is one row with two columns:
 * options on left and the plotly plot on the right
 *
 * @param $componentDiv - an empty Bootstrap 4 row (JQuery object)
 * @param isUemEnabled - true if the Action menu should be added
 * @private
 */
function _createUIElements($componentDiv, isUemEnabled) {
    //
    // make $optionsDiv (left column)
    //
    const $optionsDiv = $('<div class="col-md-3" id="forecastViz_options"></div>');

    // add Outcome, Unit, and Interval selects (form)
    const $outcomeFormRow = $(
        '<div class="form-row">\n' +
        '    <label for="target_variable" class="col-sm-4 col-form-label">Outcome:</label>\n' +
        '    <div class="col-sm-8">\n' +
        '        <select id="target_variable" class="form-control" name="target_variables"></select>\n' +
        '    </div>\n' +
        '</div>');
    const $unitFormRow = $(
        '<div class="form-row">\n' +
        '    <label for="unit" class="col-sm-4 col-form-label">Unit:</label>\n' +
        '    <div class="col-sm-8">\n' +
        '        <select id="unit" class="form-control" name="unit"></select>\n' +
        '    </div>\n' +
        '</div>');
    const $intervalFormRow = $(
        '<div class="form-row">\n' +
        '    <label for="intervals" class="col-sm-4 col-form-label">Interval:</label>\n' +
        '    <div class="col-sm-8">\n' +
        '        <select id="intervals" class="form-control" name="intervals">\n' +
        '    </div>\n' +
        '</div>');
    const $optionsForm = $('<form></form>').append($outcomeFormRow, $unitFormRow, $intervalFormRow);
    $optionsDiv.append($optionsForm);

    // add truth checkboxes
    const $truthCheckboxesDiv = $(
        '<div class="form-group form-check forecastViz_select_data ">\n' +
        '    <input title="curr truth" type="checkbox" id="forecastViz_Current_Truth" value="Current Truth" checked>\n' +
        '      &nbsp;<span id="currentTruthDate">Current (current truth date here)</span>\n' +
        '      &nbsp;<span class="forecastViz_dot" style="background-color: lightgrey; "></span>\n' +
        '    <br>\n' +
        '    <input title="truth as of" type="checkbox" id="forecastViz_Truth_as_of" value="Truth as of" checked>\n' +
        '      &nbsp;<span id="asOfTruthDate">(as of truth date here)</span>\n' +
        '      &nbsp;<span class="forecastViz_dot" style="background-color: black;"></span>\n' +
        '</div>');
    $optionsDiv.append('<div class="pt-md-3">Select Truth Data:</div>');
    $optionsDiv.append($truthCheckboxesDiv);

    // add model list controls
    var optionsDivActionsDropdown;
    if (isUemEnabled) {
        optionsDivActionsDropdown = '<div class="dropdown">\n' +
            '  <button class="btn btn-sm dropdown-toggle" type="button" id="dropdownMenuButton" style="float: right;" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\n' +
            '    Actions\n' +
            '  </button>\n' +
            '  <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">\n' +
            '    <a class="dropdown-item" id="addUserEnsemble" href="#">Add User Ensemble</a>\n' +
            '    <a class="dropdown-item disabled" id="removeUserEnsemble" href="#">Remove User Ensemble</a>\n' +
            '    <a class="dropdown-item disabled" id="downloadUserEnsemble" href="#">Download User Ensemble CSV</a>\n' +
            '    <a class="dropdown-item disabled" id="infoUserEnsemble" href="#">User Ensemble Info...</a>\n' +
            '    <a class="dropdown-item" id="editNameUserEnsemble" href="#">Edit User Ensemble Model Name...</a>\n' +
            '    <a class="dropdown-item" id="helpUserEnsemble" target="_blank" href="https://github.com/reichlab/predtimechart#human-judgement-ensemble-model">Help...</a>\n' +
            '  </div>\n' +
            '</div>\n';
    } else {
        optionsDivActionsDropdown = '';
    }
    $optionsDiv.append($(
        optionsDivActionsDropdown +
        '<button type="button" class="btn btn-sm rounded-pill" id="forecastViz_shuffle" style="float: right;">\n' +
        '    Shuffle Colours</button>\n' +
        '<label class="forecastViz_label" for="forecastViz_all">Select Models:</label>\n' +
        '<input type="checkbox" id="forecastViz_all">'));

    // add the model list itself
    $optionsDiv.append($('<div id="forecastViz_select_model"></div>'));


    //
    // make $vizDiv (right column)
    //
    const $vizDiv = $('<div class="col-md-9" id="forecastViz_viz"></div>');
    const $buttonsDiv = $(
        '<div class="container">\n' +
        '    <div class="col-md-12 text-center">\n' +
        '        <button type="button" class="btn btn-primary" id="decrement_as_of">&lt;</button>\n' +
        '        <button type="button" class="btn btn-primary" id="increment_as_of">&gt;</button>\n' +
        '    </div>\n' +
        '</div>'
    );
    $vizDiv.append($('<p class="forecastViz_disclaimer"><b><span id="disclaimer">(disclaimer here)</span></b></p>'));
    $vizDiv.append($('<div id="ploty_div" style="width: 100%; height: 72vh; position: relative;"></div>'));
    $vizDiv.append($buttonsDiv);
    $vizDiv.append($('<p style="text-align:center"><small>Note: You can navigate to forecasts from previous weeks with the left and right arrow keys</small></p>'));


    //
    // finish
    //
    $componentDiv.empty().append($optionsDiv, $vizDiv);
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


//
// App
//

// this implements a straightforward SPA with state - based on https://dev.to/vijaypushkin/dead-simple-state-management-in-vanilla-javascript-24p0
const App = {

    //
    // non-options vars passed to `initialize()`
    //

    isIndicateRedraw: false,  // true if app should set plot opacity when loading data
    _fetchData: null,         // as documented in `initialize()`

    _calcUemForecasts: null,  // user ensemble model computation function as documented in `initialize()`
    isUemEnabled: true,       // true if user ensemble model feature is enabled


    //
    // app state
    //

    state: {
        // Static data, fixed at time of creation:
        target_variables: [],
        units: [],
        intervals: [],
        available_as_ofs: [],
        current_date: "",
        models: [],
        disclaimer: "",

        // Dynamic/updated data, used to track 2 categories:
        // 1/2 Tracks UI state:
        selected_target_var: '',
        selected_unit: '',
        selected_interval: '',
        selected_as_of_date: '',
        selected_truth: ['Current Truth', 'Truth as of'],
        selected_models: [],
        last_selected_models: [],  // last manually-selected models. used by "Select Models" checkbox
        colors: [],
        initial_xaxis_range: null,  // optional initialize() options object key

        // 2/2 Data used to create plots:
        current_truth: [],
        as_of_truth: [],
        forecasts: {},
    },


    //
    // initialization-related functions
    //

    /**
     * Initialize this app using the passed args.
     *
     * @param {String} componentDiv - id of a DOM node to populate. it must be an empty Bootstrap 4 row
     * @param {Function} _fetchData - function as documented in forecast-repository/forecast_app/templates/project_viz.html .
     *   args: isForecast, targetKey, unitAbbrev, referenceDate
     * @param {Boolean} isIndicateRedraw - controls whether the plot area should be grayed out while waiting for data
     *   requests
     * @param {Object} options - visualization initialization options as documented at https://docs.zoltardata.com/visualizationoptionspage/
     * @param {Function} _calcUemForecasts - optional human judgement ensemble model function as documented in forecast-repository/forecast_app/templates/project_viz.html .
     *   args: componentModels, targetKey, referenceDate, userModelName. NB: pass null for the function to disable the
     *   feature.
     */
    initialize(componentDiv, _fetchData, isIndicateRedraw, options, _calcUemForecasts) {
        this._fetchData = _fetchData;
        this.isIndicateRedraw = isIndicateRedraw;
        this._calcUemForecasts = _calcUemForecasts;

        console.debug('initialize(): entered', componentDiv, _fetchData, isIndicateRedraw, options, _calcUemForecasts);

        // save static vars
        this.state.target_variables = options['target_variables'];
        this.state.units = options['units'];
        this.state.intervals = options['intervals'];
        this.state.available_as_ofs = options['available_as_ofs'];
        this.state.current_date = options['current_date'];
        this.state.models = options['models'];
        this.state.disclaimer = options['disclaimer'];
        this.state.colors = Array(parseInt(this.state.models.length / 10, 10) + 1).fill([
            '#0d0887',
            '#46039f',
            '#7201a8',
            '#9c179e',
            '#bd3786',
            '#d8576b',
            '#ed7953',
            '#fb9f3a',
            '#fdca26',
            '#f0f921'
        ]).flat()
        this.state.initial_xaxis_range = options.hasOwnProperty('initial_xaxis_range') ? options['initial_xaxis_range'] : null;

        // save initial selected state
        this.state.selected_target_var = options['initial_target_var'];
        this.state.selected_unit = options['initial_unit'];
        this.state.selected_interval = options['initial_interval'];
        this.state.selected_as_of_date = options['initial_as_of'];
        // this.state.selected_truth: synchronized via default <input ... checked> setting
        this.state.selected_models = options['initial_checked_models'];

        // populate UI elements, setting selection state to initial, first validating `componentDiv`
        const componentDivEle = document.getElementById(componentDiv);
        if (componentDivEle === null) {
            throw `componentDiv DOM node not found: '${componentDiv}'`;
        }

        this.initializeBootstrapComponents(); // done here instead of initializeUI() so below `modal('show')` will work

        // disable human judgement ensemble model feature if requested or if default model name conflict
        if (typeof (_calcUemForecasts) != 'function') {
            console.log('disabling human judgement ensemble model feature', _calcUemForecasts, typeof (_calcUemForecasts));
            this.isUemEnabled = false;
        } else if (this.state.models.includes(USER_ENSEMBLE_MODEL.name)) {
            // oops: default user ensemble model name is taken. try once to generate a unique one
            const newUemName = USER_ENSEMBLE_MODEL.name + '_' + Math.floor(Date.now() / 1000);  // timestamp in seconds
            if (this.state.models.includes(newUemName)) {
                console.warn('USER_ENSEMBLE_MODEL.name conflict. disabling human judgement ensemble model feature',
                    USER_ENSEMBLE_MODEL.name, this.state.models);

                // configure and show the info modal
                $('#uemInfoModalTitle').html('Disabling human judgement ensemble model feature');
                $('#uemInfoModalBody').html(`The default name '${USER_ENSEMBLE_MODEL.name}' was in the models list.`);
                $('#uemInfoModal').modal('show');
            } else {
                USER_ENSEMBLE_MODEL.name = newUemName;
                console.warn('USER_ENSEMBLE_MODEL.name conflict. renamed', USER_ENSEMBLE_MODEL.name,
                    this.state.models, newUemName);
            }
        }

        console.log('initialize(): initializing UI');
        const $componentDiv = $(componentDivEle);
        _createUIElements($componentDiv, this.isUemEnabled);
        this.initializeUI();

        // wire up UI controls (event handlers)
        this.addEventHandlers();

        // pull initial data (current truth, selected truth, and selected forecast) and update the plot
        console.log('initialize(): fetching data and updating plot');
        this.fetchDataUpdatePlot(true, true, false);

        console.log('initialize(): done');
    },
    initializeUI() {
        // populate options and models list (left column)
        this.initializeTargetVarsUI();
        this.initializeUnitsUI();
        this.initializeIntervalsUI();
        this.updateModelsList();

        // initialize current and as_of truth checkboxes' text
        $("#currentTruthDate").text(`Current (${this.state.current_date})`);
        this.updateTruthAsOfCheckboxText();

        // initialize disclaimer
        $('#disclaimer').text(this.state.disclaimer);

        // initialize plotly (right column)
        const plotyDiv = document.getElementById('ploty_div');
        const data = []  // data will be update by `updatePlot()`
        const layout = this.getPlotlyLayout();
        const calendarIcon = {  // https://fontawesome.com/icons/calendar-days?f=classic&s=solid
            'width': 448,
            'height': 512,
            'path': "M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192zm64 80v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm128 0v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H208c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H336zM64 400v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H208zm112 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H336c-8.8 0-16 7.2-16 16z"
        };
        Plotly.newPlot(plotyDiv, data, layout, {
            modeBarButtonsToRemove: ['lasso2d', 'autoScale2d'],
            modeBarButtonsToAdd: [{
                name: 'Jump to As_Of',
                icon: calendarIcon,
                click: () => null,  // click (required here) is handled by daterangepicker below
            }]
        });
        this.initializeDateRangePicker();  // b/c jquery binding is apparently lost with any Plotly.*() call
    },
    initializeDateRangePicker() {
        // initialize https://www.daterangepicker.com/ . regarding the jquery selector for the above icon, the svg is:
        // <a rel="tooltip" class="modebar-btn" data-title="Jump to As_Of" data-attr="my attr" data-val="my val" data-toggle="false" data-gravity="n">
        const $icon = $("[data-title='Jump to As_Of']");  // NB: couldn't get this to work: $(".modebar-btn [data-title='Jump to As_Of']");
        const available_as_ofs = App.state.available_as_ofs[App.state.selected_target_var];
        $icon.daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            minYear: parseInt(available_as_ofs[0].slice(0, 4)),
            maxYear: parseInt(available_as_ofs.at(-1).slice(0, 4)),
        }, function (start, end, label) {
            const pickedDate = start.format('YYYY-MM-DD');
            const availableAsOfs = App.state.available_as_ofs[App.state.selected_target_var];
            const closestAsOf = closestYear(pickedDate, availableAsOfs);
            console.debug(`initializeDateRangePicker(): pickedDate=${pickedDate}, closestAsOf=${closestAsOf}, selected_as_of_date=${App.state.selected_as_of_date}`);
            if (closestAsOf !== App.state.selected_as_of_date) {
                App.state.selected_as_of_date = closestAsOf;
                App.fetchDataUpdatePlot(true, false, true);
                App.updateTruthAsOfCheckboxText();
            }
        });
    },
    initializeBootstrapComponents() {
        const $uemInfoModalDiv = $(
            '<div class="modal fade" id="uemInfoModal" tabIndex="-1" aria-labelledby="uemInfoModalTitle"\n' +
            '     aria-hidden="true">\n' +
            '    <div class="modal-dialog">\n' +
            '        <div class="modal-content">\n' +
            '            <div class="modal-header">\n' +
            '                <h5 class="modal-title" id="uemInfoModalTitle">(title here)</h5>\n' +
            '                <a class="close" data-dismiss="modal">&times;</a>\n' +
            '            </div>\n' +
            '            <div class="modal-body" id="uemInfoModalBody">(body here)</div>\n' +
            '            <div class="modal-footer">\n' +
            '                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>\n' +
            '            </div>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '</div>'
        );
        $(document.body).append($uemInfoModalDiv);

        // form onsubmit trick per https://stackoverflow.com/questions/15239236/bootstrap-modal-dialogs-with-a-single-text-input-field-always-dismiss-on-enter-k
        const $uemEditModelNameModalDiv = $(
            '<div class="modal fade" id="uemEditModelNameModal" tabIndex="-1" aria-labelledby="uemInfoModalTitle"\n' +
            '     aria-hidden="true">\n' +
            '    <div class="modal-dialog">\n' +
            '        <div class="modal-content">\n' +
            '            <div class="modal-header">\n' +
            '                <h5 class="modal-title" id="uemInfoModalTitle">User Ensemble Model Name</h5>\n' +
            '                <a class="close" data-dismiss="modal">&times;</a>\n' +
            '            </div>\n' +
            '            <div class="modal-body">\n' +
            '               <form novalidate onsubmit="return false">\n' +
            '                   <div class="form-group">\n' +
            '                       <label for="model-name" class="col-form-label">Model name:</label>\n' +
            '                       <input type="text" class="form-control is-valid" id="uemEditModelName" value="(name here)">\n' +
            '                       <div class="invalid-feedback hidden">(invalid here)</div>\n' +
            '                   </div>\n' +
            '               </form>\n' +
            '            </div>\n' +
            '            <div class="modal-footer">\n' +
            '                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>\n' +
            '                <button type="button" class="btn btn-primary" data-dismiss="modal" id="uemEditSaveButton">Save</button>\n' +
            '           </div>\n' +
            '    </div>\n' +
            '</div>'
        );
        $(document.body).append($uemEditModelNameModalDiv);
    },
    initializeTargetVarsUI() {
        // populate the target variable select
        const $targetVarsSelect = $("#target_variable");
        const thisState = this.state;
        $targetVarsSelect.empty();
        this.state.target_variables.forEach(function (targetVar) {
            const selected = targetVar.value === thisState.selected_target_var ? 'selected' : '';
            const optionNode = `<option value="${targetVar.value}" ${selected} >${targetVar.text}</option>`;
            $targetVarsSelect.append(optionNode);
        });
    },
    initializeUnitsUI() {
        // populate the unit select
        const $unitSelect = $("#unit");
        const thisState = this.state;
        $unitSelect.empty();
        this.state.units.forEach(function (unit) {
            const selected = unit.value === thisState.selected_unit ? 'selected' : '';
            const optionNode = `<option value="${unit.value}" ${selected} >${unit.text}</option>`;
            $unitSelect.append(optionNode);
        });
    },
    initializeIntervalsUI() {
        // populate the interval select
        const $intervalsSelect = $("#intervals");
        const thisState = this.state;
        $intervalsSelect.empty();
        this.state.intervals.forEach(function (interval) {
            const selected = interval === thisState.selected_interval ? 'selected' : '';
            const optionNode = `<option value="${interval}" ${selected} >${interval}</option>`;
            $intervalsSelect.append(optionNode);
        });
    },
    updateModelsList() {
        // populate the select model div
        const $selectModelDiv = $("#forecastViz_select_model");
        const thisState = this.state;
        $selectModelDiv.empty();

        // split models into two groups: those with forecasts (enabled, colored) and those without (disabled, gray)
        // 1. add models with forecasts
        this.state.models
            .filter(function (model) {
                return App.state.forecasts.hasOwnProperty(model);
            })
            .forEach(function (model) {
                const isChecked = (thisState.selected_models.indexOf(model) > -1);
                const modelIdx = thisState.models.indexOf(model);
                $selectModelDiv.append(_selectModelDiv(model, thisState.colors[modelIdx], true, isChecked));
            });

        // 2. add models without forecasts
        this.state.models
            .filter(function (model) {
                return !App.state.forecasts.hasOwnProperty(model);
            })
            .forEach(function (model) {
                const isChecked = (thisState.selected_models.indexOf(model) > -1);
                $selectModelDiv.append(_selectModelDiv(model, 'grey', false, isChecked));
            });

        // re-wire up model checkboxes
        this.addModelCheckEventHandler();

        // update the user ensemble model's error icon
        _updateUemErrorIcon();
    },
    addEventHandlers() {
        // option, unit, and interval selects
        $('#target_variable').on('change', function () {
            App.state.selected_target_var = this.value;
            App.fetchDataUpdatePlot(true, true, false);
        });
        $('#unit').on('change', function () {
            App.state.selected_unit = this.value;
            App.fetchDataUpdatePlot(true, true, false);
        });
        $('#intervals').on('change', function () {
            App.state.selected_interval = this.value;
            App.fetchDataUpdatePlot(false, null, true);
        });

        // truth checkboxes
        $("#forecastViz_Current_Truth").change(function () {
            _setSelectedTruths();
        });
        $("#forecastViz_Truth_as_of").change(function () {
            _setSelectedTruths();
        });

        // Shuffle Colours button
        $("#forecastViz_shuffle").click(function () {
            App.state.colors = App.state.colors.sort(() => 0.5 - Math.random())
            App.updateModelsList();
            App.updatePlot(true);
        });

        // User Ensemble Model Actions dropdown button. NB: these will not be created by initialize() if !isUemEnabled,
        // but JQuery will not error if they don't exist :-)
        $("#addUserEnsemble").click(function (event) {
            console.debug("addUserEnsemble click", App.state.selected_models);
            event.preventDefault();
            App.removeUserEnsembleModel();
            App.addUserEnsembleModel();
            App.updateModelsList();
            App.updatePlot(true);
            $("#removeUserEnsemble").removeClass('disabled');    // enable
            $("#downloadUserEnsemble").removeClass('disabled');  // ""
            $("#infoUserEnsemble").removeClass('disabled');      // ""
            $("#editNameUserEnsemble").addClass('disabled');     // disable
        });
        $("#removeUserEnsemble").click(function (event) {
            event.preventDefault();
            App.removeUserEnsembleModel();
            App.updateModelsList();
            App.updatePlot(true);
            $("#removeUserEnsemble").addClass('disabled');       // disable
            $("#downloadUserEnsemble").addClass('disabled');     // ""
            $("#infoUserEnsemble").addClass('disabled');         // ""
            $("#editNameUserEnsemble").removeClass('disabled');  // enable
        });
        $("#downloadUserEnsemble").click(function (event) {
            console.debug("#downloadUserEnsemble click", USER_ENSEMBLE_MODEL.models, App.state.selected_target_var, App.state.selected_as_of_date);
            event.preventDefault();
            let fileName = '';
            App._calcUemForecasts(USER_ENSEMBLE_MODEL.models, App.state.selected_target_var, App.state.selected_as_of_date, USER_ENSEMBLE_MODEL.name)  // Promise
                .then(response => {
                    if (!response.ok) {
                        console.error('#downloadUserEnsemble click: bad response', response);
                        return response.text().then(text => {
                            throw new Error(text);
                        })
                    }

                    // contentDisposition is like: "attachment; filename=\"2022-01-29-User-Ensemble.csv\""
                    const contentDisposition = Object.fromEntries(response.headers)['content-disposition'];
                    fileName = contentDisposition.split('"')[1];
                    return response.text();
                })
                .then((text) => {
                    console.debug("#downloadUserEnsemble click: data", typeof (text), fileName);
                    download(text, 'text/csv', fileName);
                    console.debug("#downloadUserEnsemble click: download() done");

                    // configure and show the info modal
                    $('#uemInfoModalTitle').html('CSV File Downloaded');
                    $('#uemInfoModalBody').html(`User ensemble downloaded to "${fileName}".`);
                    $('#uemInfoModal').modal('show');
                })
                .catch(error => {  // NB: fetch() does not generate an error for 4__ responses
                    console.error(`#downloadUserEnsemble click: error: ${error.message}`)

                    // configure and show the info modal
                    $('#uemInfoModalTitle').html('Error Downloading CVS File');
                    $('#uemInfoModalBody').html(`"${error.message}"`);
                    $('#uemInfoModal').modal('show');
                });
        });
        $("#infoUserEnsemble").click(function (event) {
            event.preventDefault();

            // configure and show the info modal
            const modelName = USER_ENSEMBLE_MODEL.name;
            const componentModels = USER_ENSEMBLE_MODEL.models.join(", ");
            const lastError = (USER_ENSEMBLE_MODEL.lastError === null) ? '(no errors)' : USER_ENSEMBLE_MODEL.lastError;
            const $userInfoForm = $(
                '<form>\n' +
                '  <div class="form-group">\n' +
                '    <label for="model-name" class="col-form-label">Model name:</label>\n' +
                `    <input type="text" class="form-control" id="model-name" readonly value="${modelName}">\n` +
                '  </div>\n' +
                '  <div class="form-group">\n' +
                '    <label for="model-list" class="col-form-label">Component models:</label>\n' +
                `    <input type="text" class="form-control" id="model-list" readonly value="${componentModels}">\n` +
                '  </div>\n' +
                '  <div class="form-group">\n' +
                '    <label for="last-error" class="col-form-label">Last error:</label>\n' +
                `    <textarea class="form-control" id="last-error" readonly>${lastError}</textarea>\n` +
                '  </div>\n' +
                '</form>'
            );
            $('#uemInfoModalTitle').html('User Ensemble Settings');
            $('#uemInfoModalBody').html($userInfoForm);
            $('#uemInfoModal').modal('show');
        });

        // handle #uemEditModelNameModal activity:
        $('#uemEditModelName').on('input', function () {
            // validate model name edit on each keystroke, displaying the result:
            const modelName = $('#uemEditModelName').val();
            const isInvalid = _isInvalidUemName(modelName);  // error message if invalid; false if valid
            const $invalidFeedbackDiv = $('#uemEditModelNameModal .invalid-feedback');
            const $modelNameInput = $('#uemEditModelNameModal input');
            if (isInvalid) {
                $invalidFeedbackDiv.html(isInvalid);
                $invalidFeedbackDiv.show();
                $modelNameInput.addClass('is-invalid')
            } else {
                $invalidFeedbackDiv.html('');
                $invalidFeedbackDiv.hide();
                $modelNameInput.removeClass('is-invalid')
            }
        });
        $("#uemEditSaveButton").click(function () {
            // save the new name (assumed valid)
            const newModelName = $("#uemEditModelName").val();
            USER_ENSEMBLE_MODEL.name = newModelName;
            console.info(`saved new user ensemble model name: '${newModelName}'`);
        });
        $("#editNameUserEnsemble").click(function (event) {
            event.preventDefault();

            // configure and show the user model name edit modal
            const modelName = USER_ENSEMBLE_MODEL.name;
            $("#uemEditModelName").val(modelName);  // initialize name to current
            $('#uemEditModelNameModal').modal('show');
        });

        // "Select Models" checkbox
        $("#forecastViz_all").change(function () {
            const $this = $(this);
            const isChecked = $this.prop('checked');
            if (isChecked) {
                App.state.last_selected_models = App.state.selected_models;
                App.state.selected_models = App.selectableModels();
            } else {
                App.state.selected_models = App.state.last_selected_models;
            }
            App.checkModels(App.state.selected_models);
            App.updatePlot(true);
        });

        // wire up model checkboxes
        this.addModelCheckEventHandler();

        // left and right buttons
        $("#decrement_as_of").click(function () {
            App.decrementAsOf();
        });
        $("#increment_as_of").click(function () {
            App.incrementAsOf();
        });

        // left and right keys
        window.addEventListener('keydown', function (event) {
            if (event.code === "ArrowLeft") {
                App.decrementAsOf();
            } else if (event.code === "ArrowRight") {
                App.incrementAsOf();
            }
        });
    },
    addModelCheckEventHandler() {
        $(".model-check").change(function () {
            const $this = $(this);
            const model = $this.prop('id');
            const isChecked = $this.prop('checked');
            const isInSelectedModels = (App.state.selected_models.indexOf(model) > -1);
            if (isChecked && !isInSelectedModels) {
                App.state.selected_models.push(model);
            } else if (!isChecked && isInSelectedModels) {
                App.state.selected_models = App.state.selected_models.filter(function (value) {
                    return value !== model;
                });  // App.state.selected_models.remove(model);
            }
            App.fetchDataUpdatePlot(false, null, true);
        });
    },


    //
    // event handler functions
    //

    incrementAsOf() {
        const state = this.state;
        const as_of_index = state.available_as_ofs[state.selected_target_var].indexOf(state.selected_as_of_date);
        if (as_of_index < state.available_as_ofs[state.selected_target_var].length - 1) {
            state.selected_as_of_date = state.available_as_ofs[state.selected_target_var][as_of_index + 1];
            this.fetchDataUpdatePlot(true, false, true);
            this.updateTruthAsOfCheckboxText();
        }
    },
    decrementAsOf() {
        const state = this.state;
        const as_of_index = state.available_as_ofs[state.selected_target_var].indexOf(state.selected_as_of_date);
        if (as_of_index > 0) {
            state.selected_as_of_date = state.available_as_ofs[state.selected_target_var][as_of_index - 1];
            this.fetchDataUpdatePlot(true, false, true);
            this.updateTruthAsOfCheckboxText();
        }
    },
    updateTruthAsOfCheckboxText() {
        $("#asOfTruthDate").text(`As of ${this.state.selected_as_of_date}`);
    },

    // Returns an array of models that are not grayed out.
    selectableModels() {
        return this.state.models.filter(function (element, index) {
            return index < 100;
        });
    },

    // Checks each item in #forecastViz_select_model that's in the passed list.
    checkModels(models) {
        this.state.models.forEach(function (model) {
            const isShouldCheck = (models.indexOf(model) > -1);
            const $modelCheckbox = $(`#${model}`);
            $modelCheckbox.prop('checked', isShouldCheck);
        });
    },

    //
    // date fetch-related functions
    //

    /**
     * Updates the plot, optionally first fetching data.
     *
     * @param isFetchFirst true if should fetch before plotting. false if no fetch
     * @param isFetchCurrentTruth applies if isFetchFirst: controls whether current truth is fetched in addition to
     *   as_of truth and forecasts. ignored if not isFetchFirst
     * @param isPreserveYLimit passed to updatePlot() - see
     */
    fetchDataUpdatePlot(isFetchFirst, isFetchCurrentTruth, isPreserveYLimit) {
        if (isFetchFirst) {
            const promises = [this.fetchAsOfTruth(), this.fetchForecasts()];
            if (isFetchCurrentTruth) {
                promises.push(this.fetchCurrentTruth());
            }
            console.log(`fetchDataUpdatePlot(${isFetchFirst}, ${isFetchCurrentTruth}, ${isPreserveYLimit}): waiting on promises`);
            const $plotyDiv = $('#ploty_div');
            if (this.isIndicateRedraw) {
                $plotyDiv.fadeTo(0, 0.25);
            }
            Promise.all(promises).then((values) => {
                console.log(`fetchDataUpdatePlot(${isFetchFirst}, ${isFetchCurrentTruth}, ${isPreserveYLimit}): Promise.all() done. updating plot`, values);

                // update user ensemble model if any
                if (this.isUemEnabled && this.state.models.includes(USER_ENSEMBLE_MODEL.name)) {
                    try {
                        this.state.forecasts[USER_ENSEMBLE_MODEL.name] = _calcUemForecasts(USER_ENSEMBLE_MODEL.models, this.state.forecasts);  // replaces if present
                        USER_ENSEMBLE_MODEL.lastError = null;
                        console.log('fetchDataUpdatePlot(): forecasts:', this.state.forecasts[USER_ENSEMBLE_MODEL.name]);
                    } catch (error) {
                        USER_ENSEMBLE_MODEL.lastError = error;
                        console.warn(`fetchDataUpdatePlot(): error calling _calcUemForecasts(): ${error}`);
                    }
                }

                this.updateModelsList();
                this.updatePlot(isPreserveYLimit);
                if (this.isIndicateRedraw) {
                    $plotyDiv.fadeTo(0, 1.0);
                }
            });
        } else {
            console.log(`fetchDataUpdatePlot(${isFetchFirst}, ${isFetchCurrentTruth}, ${isPreserveYLimit}): updating plot`);
            this.updatePlot(isPreserveYLimit);
        }
    },
    fetchCurrentTruth() {
        this.state.current_truth = [];  // clear in case of error
        return this._fetchData(false,  // Promise
            this.state.selected_target_var, this.state.selected_unit, this.state.current_date)
            .then(response => response.json())
            .then((data) => {
                this.state.current_truth = data;
            })
            .catch(error => console.log(`fetchCurrentTruth(): error: ${error.message}`));
    },
    fetchAsOfTruth() {
        this.state.as_of_truth = [];  // clear in case of error
        return this._fetchData(false,  // Promise
            this.state.selected_target_var, this.state.selected_unit, this.state.selected_as_of_date)
            .then(response => response.json())
            .then((data) => {
                this.state.as_of_truth = data;
            })
            .catch(error => console.log(`fetchAsOfTruth(): error: ${error.message}`));
    },
    fetchForecasts() {
        this.state.forecasts = {};  // clear in case of error
        return this._fetchData(true,  // Promise
            this.state.selected_target_var, this.state.selected_unit, this.state.selected_as_of_date)
            .then(response => response.json())  // Promise
            .then((data) => {
                this.state.forecasts = data;
            })
            .catch(error => console.log(`fetchForecasts(): error: ${error.message}`));
    },

    //
    // user ensemble model-related functions
    //

    /**
     * Creates a user ensemble model (UEM) named USER_ENSEMBLE_MODEL.name using the currently-selected models in
     * #forecastViz_select_model. Does not call removeUserEnsembleModel() first.
     */
    addUserEnsembleModel() {
        // validate componentModels: there must be at least two
        const componentModels = this.state.selected_models.filter(function (value) {
            return value !== USER_ENSEMBLE_MODEL.name;
        });

        // validation #1
        if (componentModels.length <= 1) {
            console.warn(`addUserEnsembleModel(): must select two or more componentModels. #selected=${componentModels.length}`);

            // configure and show the info modal
            $('#uemInfoModalTitle').html('Invalid Component Models');
            $('#uemInfoModalBody').html(`Must select two or more componentModels (${componentModels.length} selected).`);
            $('#uemInfoModal').modal('show');

            return;
        }

        try {
            this.state.forecasts[USER_ENSEMBLE_MODEL.name] = _calcUemForecasts(componentModels, this.state.forecasts);  // replaces if present
            USER_ENSEMBLE_MODEL.lastError = null;
            console.log('addUserEnsembleModel(): forecasts:', this.state.forecasts[USER_ENSEMBLE_MODEL.name]);
        } catch (error) {
            USER_ENSEMBLE_MODEL.lastError = error;
            console.warn(`addUserEnsembleModel(): error calling _calcUemForecasts(): ${error}`);
        }

        if (!this.state.models.includes(USER_ENSEMBLE_MODEL.name)) {
            this.state.models.unshift(USER_ENSEMBLE_MODEL.name);  // add to front so sorts at top of models list
        }
        if (!this.state.selected_models.includes(USER_ENSEMBLE_MODEL.name)) {
            this.state.selected_models.push(USER_ENSEMBLE_MODEL.name);
        }
        USER_ENSEMBLE_MODEL.models.length = 0;  // quick way to clear an array
        USER_ENSEMBLE_MODEL.models.push(...componentModels);
        console.log('addUserEnsembleModel(): created:', USER_ENSEMBLE_MODEL.name, USER_ENSEMBLE_MODEL.models);
    },

    /**
     * Removes the user ensemble model (UEM) named USER_ENSEMBLE_MODEL.name, if any.
     */
    removeUserEnsembleModel() {
        delete this.state.forecasts[USER_ENSEMBLE_MODEL.name];
        this.state.models = this.state.models.filter(item => item !== USER_ENSEMBLE_MODEL.name)
        this.state.selected_models = this.state.selected_models.filter(item => item !== USER_ENSEMBLE_MODEL.name)
        USER_ENSEMBLE_MODEL.models.length = 0;  // quick way to clear an array
        USER_ENSEMBLE_MODEL.lastError = null;
    },

    //
    // plot-related functions
    //

    /**
     * Updates the plot, preserving any current xaxis range limit, and optionally any current yaxis range limit
     *
     * @param isPreserveYLimit true if should preserve any yaxis range limit currently set
     */
    updatePlot(isPreserveYLimit) {
        const plotyDiv = document.getElementById('ploty_div');
        const data = this.getPlotlyData();
        let layout = this.getPlotlyLayout();
        if (data.length === 0) {
            layout = {title: {text: 'No Visualization Data Found'}};
        }

        // before updating the plot we preserve the xaxis rangeslider range limit ("zoom") by retrieving it, redrawing
        // the plot, and then re-laying it out. NB: the default xaxis.range seems to be [-1, 6] when updating for the
        // first time (yaxis = [-1, 4]), so we check for the range being those arrays to determine whether to preserve
        // or not
        var currXAxisRange = plotyDiv.layout.xaxis.range;
        var currYAxisRange = plotyDiv.layout.yaxis.range;
        var isXAxisRangeDefault = ((currXAxisRange.length === 2) && (currXAxisRange[0] === -1) && (currXAxisRange[1] === 6));
        var isYAxisRangeDefault = ((currYAxisRange.length === 2) && (currYAxisRange[0] === -1) && (currYAxisRange[1] === 4));
        Plotly.react(plotyDiv, data, layout);
        if (!isXAxisRangeDefault) {
            Plotly.relayout(plotyDiv, 'xaxis.range', currXAxisRange);
        }
        if (isPreserveYLimit && !isYAxisRangeDefault) {
            Plotly.relayout(plotyDiv, 'yaxis.range', currYAxisRange);
        }

        // optionally handle initial_xaxis_range
        if (isXAxisRangeDefault && (this.state.initial_xaxis_range != null)) {
            Plotly.relayout(plotyDiv, 'xaxis.range', this.state.initial_xaxis_range);
        }
        this.initializeDateRangePicker();  // b/c jquery binding is apparently lost with any Plotly.*() call
    },
    getPlotlyLayout() {
        if (this.state.target_variables.length === 0) {
            return {};
        }

        const variable = this.state.target_variables.filter((obj) => obj.value === this.state.selected_target_var)[0].plot_text;
        const unit = this.state.units.filter((obj) => obj.value === this.state.selected_unit)[0].text;
        return {
            autosize: true,
            showlegend: false,
            title: {
                text: `Forecasts of ${variable} <br> in ${unit} as of ${this.state.selected_as_of_date}`,
                x: 0.5,
                y: 0.90,
                xanchor: 'center',
                yanchor: 'top',
            },
            xaxis: {
                title: {text: 'Date'},
                rangeslider: {},
            },
            yaxis: {
                title: {text: variable, hoverformat: '.2f'},
                fixedrange: false
            }
        }
    },
    getPlotlyData() {
        const state = this.state;
        let pd = [];
        if (state.selected_truth.includes('Current Truth') && Object.keys(state.current_truth).length !== 0) {
            pd.push({
                x: state.current_truth.date,
                y: state.current_truth.y,
                type: 'scatter',
                mode: 'lines',
                name: 'Current Truth',
                marker: {color: 'darkgray'}
            })
        }
        if (state.selected_truth.includes('Truth as of') && Object.keys(state.as_of_truth).length !== 0) {
            pd.push({
                x: state.as_of_truth.date,
                y: state.as_of_truth.y,
                type: 'scatter',
                mode: 'lines',
                opacity: 0.5,
                name: `Truth as of ${state.selected_as_of_date}`,
                marker: {color: 'black'}
            })
        }

        let pd0 = []
        if (state.forecasts.length !== 0) {
            // add the line for predictive medians
            pd0 = Object.keys(state.forecasts).map((model) => {
                if (state.selected_models.includes(model)) {
                    const index = state.models.indexOf(model)
                    const model_forecasts = state.forecasts[model]
                    const date = model_forecasts.target_end_date
                    const lq1 = model_forecasts['q0.025']
                    const lq2 = model_forecasts['q0.25']
                    const mid = model_forecasts['q0.5']
                    const uq1 = model_forecasts['q0.75']
                    const uq2 = model_forecasts['q0.975']

                    // 1-3: sort model forecasts in order of target end date
                    // 1) combine the arrays:
                    const list = []
                    for (let j = 0; j < date.length; j++) {
                        list.push({
                            date: date[j],
                            lq1: lq1[j],
                            lq2: lq2[j],
                            uq1: uq1[j],
                            uq2: uq2[j],
                            mid: mid[j]
                        })
                    }

                    // 2) sort:
                    list.sort((a, b) => (moment(a.date).isBefore(b.date) ? -1 : 1))

                    // 3) separate them back out:
                    for (let k = 0; k < list.length; k++) {
                        model_forecasts.target_end_date[k] = list[k].date
                        model_forecasts['q0.025'][k] = list[k].lq1
                        model_forecasts['q0.25'][k] = list[k].lq2
                        model_forecasts['q0.5'][k] = list[k].mid
                        model_forecasts['q0.75'][k] = list[k].uq1
                        model_forecasts['q0.975'][k] = list[k].uq2
                    }

                    const x = [];
                    if (Object.keys(state.as_of_truth).length !== 0) {
                        x.push(state.as_of_truth.date.slice(-1)[0]);
                    }
                    x.push(model_forecasts.target_end_date.slice(0)[0]);

                    const y = [];
                    if (Object.keys(state.as_of_truth).length !== 0) {
                        y.push(state.as_of_truth.y.slice(-1)[0]);
                    }
                    y.push(model_forecasts['q0.5'].slice(0)[0]);

                    return {
                        x: x,
                        y: y,
                        mode: 'lines',
                        type: 'scatter',
                        name: model,
                        hovermode: false,
                        opacity: 0.7,
                        line: {color: state.colors[index]},
                        hoverinfo: 'none'
                    };
                }
                return []
            })
        }
        pd = pd0.concat(...pd)

        // add interval polygons
        let pd1 = []
        if (state.forecasts.length !== 0) {
            pd1 = Object.keys(state.forecasts).map((model) => {  // notes that state.forecasts are still sorted
                if (state.selected_models.includes(model)) {
                    const index = state.models.indexOf(model)
                    const is_hosp = state.selected_target_var === 'hosp'
                    const mode = is_hosp ? 'lines' : 'lines+markers'
                    const model_forecasts = state.forecasts[model]
                    let upper_quantile
                    let lower_quantile
                    const plot_line = {
                        // point forecast
                        x: model_forecasts.target_end_date,
                        y: model_forecasts['q0.5'],
                        type: 'scatter',
                        name: model,
                        opacity: 0.7,
                        mode,
                        line: {color: state.colors[index]}
                    }

                    if (state.selected_interval === '50%') {
                        lower_quantile = 'q0.25'
                        upper_quantile = 'q0.75'
                    } else if (state.selected_interval === '95%') {
                        lower_quantile = 'q0.025'
                        upper_quantile = 'q0.975'
                    } else {
                        return [plot_line]
                    }

                    const x = Object.keys(state.as_of_truth).length !== 0 ?
                        state.as_of_truth.date.slice(-1).concat(model_forecasts.target_end_date) :
                        model_forecasts.target_end_date;
                    const y1 = Object.keys(state.as_of_truth).length !== 0 ?
                        state.as_of_truth.y.slice(-1).concat(model_forecasts[lower_quantile]) :  // lower edge
                        model_forecasts[lower_quantile];
                    const y2 = Object.keys(state.as_of_truth).length !== 0 ?
                        state.as_of_truth.y.slice(-1).concat(model_forecasts[upper_quantile]) :
                        model_forecasts[upper_quantile];  // upper edge
                    return [
                        plot_line,
                        {
                            // interval forecast -- currently fixed at 50%
                            x: [].concat(x, x.slice().reverse()),
                            y: [].concat(y1, y2.slice().reverse()),
                            fill: 'toself',
                            fillcolor: state.colors[index],
                            opacity: 0.3,
                            line: {color: 'transparent'},
                            type: 'scatter',
                            name: model,
                            showlegend: false,
                            hoverinfo: 'skip'
                        }
                    ]
                }
                return []
            })
        }
        pd = pd.concat(...pd1)

        // done!
        return pd
    },
};


export default App;  // export the module's main entry point
