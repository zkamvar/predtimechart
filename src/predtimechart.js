/**
 * predtimechart: A JavaScript (ES6 ECMAScript) module for forecast visualization.
 */

import {addEventHandlers, addModelCheckEventHandler, initializeDateRangePicker} from "./events.js";
import {getPlotlyData, getPlotlyLayout} from "./plot.js";
import {createDomElements, initializeUEMModals} from "./ui.js";
import _calcUemForecasts from './user-ensemble-model.js';
import {_isInvalidUemName, download} from "./utils.js";
import _validateOptions from './validation.js';


//
// user ensemble model (UEM) functions
//

const USER_ENSEMBLE_MODEL = {  // contains all information about the model
    name: 'User-Ensemble',  // must be a valid name, e.g., no spaces, commas, etc.
    models: [],             // list of model names making up current UEM when it was added by addUserEnsembleModel()
    lastError: null        // Error from last call to _calcUemForecasts()
}


/**
 * Updates the user ensemble model's error icon in the models list based on USER_ENSEMBLE_MODEL.lastError .
 *
 * @private
 */
function _updateUemErrorIcon(userEnsembleModel) {
    const error = userEnsembleModel.lastError;
    const $modelCheckboxParent = $(`#${userEnsembleModel.name}`).parent();  // the <label> - see _selectModelDiv()
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
    // app event handling
    //
    eventHandlers: {},  // maps eventName -> function as defined by `addEventHandlers()`. filled below


    //
    // UI state (dynamic - updated by DOM as user interacts)
    //

    uiState: {
        selected_target_var: '',
        selected_interval: '',
        selected_as_of_date: '',
        selected_truth: ['Current Truth', 'Truth as of'],
        selected_models: [],
        last_selected_models: [],  // last manually-selected models. used by "Select Models" checkbox
        colors: [],
    },


    //
    // app state
    //

    state: {
        // Static data, fixed at time of creation:
        target_variables: [],
        task_ids: [],
        intervals: [],
        available_as_ofs: [],
        current_date: "",
        models: [],
        disclaimer: "",
        initial_xaxis_range: null,  // optional initialize() options object key

        // Dynamic Data, used to create plots:
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
     * @param {Function} _fetchData - function as documented in README.md .
     *   args: isForecast, targetKey, taskIDs, referenceDate
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

        console.debug('initialize(): entered');

        // validate componentDiv
        const componentDivEle = document.getElementById(componentDiv);
        if (componentDivEle === null) {
            throw `componentDiv DOM node not found: '${componentDiv}'`;
        }

        // validate options object
        _validateOptions(options);

        // save static vars
        this.state.target_variables = options['target_variables'];
        this.state.task_ids = options['task_ids'];
        this.state.intervals = options['intervals'];
        this.state.available_as_ofs = options['available_as_ofs'];
        this.state.current_date = options['current_date'];
        this.state.models = options['models'];
        this.state.disclaimer = options['disclaimer'];
        this.state.initial_xaxis_range = options.hasOwnProperty('initial_xaxis_range') ? options['initial_xaxis_range'] : null;

        // save initial UI state (reflected in UI by `initializeUI()`)
        this.uiState.colors = Array(parseInt(this.state.models.length / 10, 10) + 1).fill([
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
        this.uiState.selected_target_var = options['initial_target_var'];
        this.uiState.selected_interval = options['initial_interval'];
        this.uiState.selected_as_of_date = options['initial_as_of'];
        // this.uiState.selected_truth: synchronized via default <input ... checked> setting
        this.uiState.selected_models = options['initial_checked_models'];

        // populate UI elements, setting selection state to initial
        initializeUEMModals();  // done here instead of initializeUI() so below `modal('show')` will work

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
        createDomElements(componentDiv, this.isUemEnabled, Object.keys(this.state.task_ids));
        this.initializeUI(options);

        // wire up UI controls (event handlers)
        addEventHandlers(this, USER_ENSEMBLE_MODEL);

        // pull initial data (current truth, selected truth, and selected forecast) and update the plot
        console.log('initialize(): fetching data and updating plot');
        this.fetchDataUpdatePlot(true, true, false);

        console.log('initialize(): done');
    },

    initializeUI(options) {
        // populate options and models list (left column)
        this.initializeTargetVarsUI();
        this.initializeTaskIDsUI(options['initial_task_ids']);
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
        const layout = getPlotlyLayout(this);
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
        initializeDateRangePicker(this);  // b/c jquery binding is apparently lost with any Plotly.*() call
    },

    initializeTargetVarsUI() {
        // populate the target variable <SELECT>
        const $targetVarsSelect = $("#target_variable");
        const thisUIState = this.uiState;
        // $targetVarsSelect.empty();
        this.state.target_variables.forEach(function (targetVar) {
            const selected = targetVar.value === thisUIState.selected_target_var ? 'selected' : '';
            const optionNode = `<option value="${targetVar.value}" ${selected} >${targetVar.text}</option>`;
            $targetVarsSelect.append(optionNode);
        });
    },

    initializeTaskIDsUI(initialTaskIds) {
        // populate task ID-related <SELECT>s
        const thisState = this.state;
        Object.keys(this.state.task_ids).forEach(function (taskIdKey) {
            const $taskIdSelect = $(`#${taskIdKey}`);  // created by _createUIElements()
            // $taskIdSelect.empty();
            const taskIdValueObjs = thisState.task_ids[taskIdKey];
            taskIdValueObjs.forEach(taskIdValueObj => {
                const selected = taskIdValueObj.value === initialTaskIds[taskIdKey] ? 'selected' : '';
                const optionNode = `<option value="${taskIdValueObj.value}" ${selected} >${taskIdValueObj.text}</option>`;
                $taskIdSelect.append(optionNode);
            });
        });
    },

    initializeIntervalsUI() {
        // populate the interval <SELECT>
        const $intervalsSelect = $("#intervals");
        const thisUIState = this.uiState;
        // $intervalsSelect.empty();
        this.state.intervals.forEach(function (interval) {
            const selected = interval === thisUIState.selected_interval ? 'selected' : '';
            const optionNode = `<option value="${interval}" ${selected} >${interval}</option>`;
            $intervalsSelect.append(optionNode);
        });
    },

    updateModelsList() {
        // populate the select model div
        const $selectModelDiv = $("#forecastViz_select_model");
        const thisState = this.state;
        const thisUIState = this.uiState;
        $selectModelDiv.empty();

        // split models into two groups: those with forecasts (enabled, colored) and those without (disabled, gray)
        // 1. add models with forecasts
        this.state.models
            .filter(function (model) {
                return App.state.forecasts.hasOwnProperty(model);
            })
            .forEach(function (model) {
                const isChecked = (thisUIState.selected_models.indexOf(model) > -1);
                const modelIdx = thisState.models.indexOf(model);
                $selectModelDiv.append(_selectModelDiv(model, thisUIState.colors[modelIdx], true, isChecked));
            });

        // 2. add models without forecasts
        this.state.models
            .filter(function (model) {
                return !App.state.forecasts.hasOwnProperty(model);
            })
            .forEach(function (model) {
                const isChecked = (thisUIState.selected_models.indexOf(model) > -1);
                $selectModelDiv.append(_selectModelDiv(model, 'grey', false, isChecked));
            });

        // re-wire up model checkboxes
        addModelCheckEventHandler(this);

        // update the user ensemble model's error icon
        _updateUemErrorIcon(USER_ENSEMBLE_MODEL);
    },

    updateTruthAsOfCheckboxText() {
        $("#asOfTruthDate").text(`As of ${this.uiState.selected_as_of_date}`);
    },

    //
    // event handler functions
    //

    // Returns an array of models that are not grayed out.
    selectableModels() {
        return this.state.models.filter(function (element, index) {
            return index < 100;  // todo xx bug? see how `updateModelsList()` splits them apart - it's NOT at 100!
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

    // returns the value(s) of the task ID <SELECT>(s) as an object similar to format of initial_task_ids, e.g.,
    // {"scenario_id": 1, "location": "48"}
    selectedTaskIDs() {
        const theSelectedTaskIDs = {};  // return value. filled next
        Object.keys(this.state.task_ids).forEach(function (taskIdKey) {
            const $taskIdSelect = $(`#${taskIdKey}`);  // created by _createUIElements()
            theSelectedTaskIDs[taskIdKey] = $taskIdSelect.val();
        });
        return theSelectedTaskIDs;
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
            this.uiState.selected_target_var, this.selectedTaskIDs(), this.state.current_date)
            .then(response => response.json())
            .then((data) => {
                this.state.current_truth = data;
            })
            .catch(error => console.log(`fetchCurrentTruth(): error: ${error.message}`));
    },

    fetchAsOfTruth() {
        this.state.as_of_truth = [];  // clear in case of error
        return this._fetchData(false,  // Promise
            this.uiState.selected_target_var, this.selectedTaskIDs(), this.uiState.selected_as_of_date)
            .then(response => response.json())
            .then((data) => {
                this.state.as_of_truth = data;
            })
            .catch(error => console.log(`fetchAsOfTruth(): error: ${error.message}`));
    },

    fetchForecasts() {
        this.state.forecasts = {};  // clear in case of error
        return this._fetchData(true,  // Promise
            this.uiState.selected_target_var, this.selectedTaskIDs(), this.uiState.selected_as_of_date)
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
        const componentModels = this.uiState.selected_models.filter(function (value) {
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
        if (!this.uiState.selected_models.includes(USER_ENSEMBLE_MODEL.name)) {
            this.uiState.selected_models.push(USER_ENSEMBLE_MODEL.name);  // write
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
        this.uiState.selected_models = this.uiState.selected_models.filter(item => item !== USER_ENSEMBLE_MODEL.name)  // write
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
        const data = getPlotlyData(this);
        let layout = getPlotlyLayout(this);
        if (data.length === 0) {
            layout = {title: {text: 'No Visualization Data Found'}};
        }

        // before updating the plot we preserve the xaxis rangeslider range limit ("zoom") by retrieving it, redrawing
        // the plot, and then re-laying it out. NB: the default xaxis.range seems to be [-1, 6] when updating for the
        // first time (yaxis = [-1, 4]), so we check for the range being those arrays to determine whether to preserve
        // or not
        const currXAxisRange = plotyDiv.layout.xaxis.range;
        const currYAxisRange = plotyDiv.layout.yaxis.range;
        const isXAxisRangeDefault = ((currXAxisRange.length === 2) && (currXAxisRange[0] === -1) && (currXAxisRange[1] === 6));
        const isYAxisRangeDefault = ((currYAxisRange.length === 2) && (currYAxisRange[0] === -1) && (currYAxisRange[1] === 4));
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
        initializeDateRangePicker(this);  // b/c jquery binding is apparently lost with any Plotly.*() call
    },
};


//
// set up event handlers (called by `addEventHandlers()`)
//

App.eventHandlers['targetVariableSelected'] = function (app, selectedTargetVar) {
    app.uiState.selected_target_var = selectedTargetVar;  // write
    app.fetchDataUpdatePlot(true, true, false);
};

App.eventHandlers['taskIdSelected'] = function (app, selectedTaskId) {
    app.fetchDataUpdatePlot(true, true, false);
};

App.eventHandlers['intervalSelected'] = function (app, selectedInterval) {
    app.uiState.selected_interval = selectedInterval;  // write
    app.fetchDataUpdatePlot(false, null, true);
};

App.eventHandlers['truthsSelected'] = function (app, selectedTruths) {
    app.uiState.selected_truth = selectedTruths;  // write
    app.fetchDataUpdatePlot(false, null, true);
};

App.eventHandlers['shuffleColors'] = function (app) {
    const appUIState = app.uiState;
    appUIState.colors = appUIState.colors.sort(() => 0.5 - Math.random())  // write
    app.updateModelsList();
    app.updatePlot(true);
};

App.eventHandlers['addUserEnsemble'] = function (app) {
    console.debug("addUserEnsemble click", app.uiState.selected_models);
    app.removeUserEnsembleModel();
    app.addUserEnsembleModel();
    app.updateModelsList();
    app.updatePlot(true);

    // todo xx these should be calls to an events.js function!:
    $("#removeUserEnsemble").removeClass('disabled');    // enable
    $("#downloadUserEnsemble").removeClass('disabled');  // ""
    $("#infoUserEnsemble").removeClass('disabled');      // ""
    $("#editNameUserEnsemble").addClass('disabled');     // disable
};

App.eventHandlers['removeUserEnsemble'] = function (app) {
    app.removeUserEnsembleModel();
    app.updateModelsList();
    app.updatePlot(true);

    // todo xx these should be calls to an events.js function!:
    $("#removeUserEnsemble").addClass('disabled');       // disable
    $("#downloadUserEnsemble").addClass('disabled');     // ""
    $("#infoUserEnsemble").addClass('disabled');         // ""
    $("#editNameUserEnsemble").removeClass('disabled');  // enable
};

App.eventHandlers['downloadUserEnsemble'] = function (app, userEnsembleModel) {
    const appUIState = app.uiState;
    console.debug("#downloadUserEnsemble click", userEnsembleModel.models, appUIState.selected_target_var, appUIState.selected_as_of_date);
    let fileName = '';
    app._calcUemForecasts(userEnsembleModel.models, appUIState.selected_target_var, appUIState.selected_as_of_date, userEnsembleModel.name)  // Promise
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
            // todo xx these should be calls to an events.js function!:
            $('#uemInfoModalTitle').html('CSV File Downloaded');
            $('#uemInfoModalBody').html(`User ensemble downloaded to "${fileName}".`);
            $('#uemInfoModal').modal('show');
        })
        .catch(error => {  // NB: fetch() does not generate an error for 4__ responses
            console.error(`#downloadUserEnsemble click: error: ${error.message}`)

            // configure and show the info modal
            // todo xx these should be calls to an events.js function!:
            $('#uemInfoModalTitle').html('Error Downloading CVS File');
            $('#uemInfoModalBody').html(`"${error.message}"`);
            $('#uemInfoModal').modal('show');
        });
};

App.eventHandlers['infoUserEnsemble'] = function (app, userEnsembleModel) {
    // configure and show the info modal
    const modelName = userEnsembleModel.name;
    const componentModels = userEnsembleModel.models.join(", ");
    const lastError = (userEnsembleModel.lastError === null) ? '(no errors)' : userEnsembleModel.lastError;

    // todo xx these should be calls to an events.js function!:
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
};

App.eventHandlers['uemEditModelNameInput'] = function (app) {
    // validate model name edit on each keystroke, displaying the result:
    // todo xx these should be calls to an events.js function!:
    const modelName = $('#uemEditModelName').val();
    const isInvalid = _isInvalidUemName(app.state.models, modelName);  // error message if invalid; false if valid
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
};

App.eventHandlers['uemEditSaveModelName'] = function (app, userEnsembleModel, newModelName) {
    // save the new name (assumed valid)
    userEnsembleModel.name = newModelName;
    console.info(`saved new user ensemble model name: '${newModelName}'`);
};

App.eventHandlers['toggleModels'] = function (app, isChecked) {
    const appUIState = app.uiState;
    if (isChecked) {
        appUIState.last_selected_models = appUIState.selected_models;  // write
        appUIState.selected_models = app.selectableModels();            // write
    } else {
        appUIState.selected_models = appUIState.last_selected_models;  // write
    }
    app.checkModels(appUIState.selected_models);
    app.updatePlot(true);
};

App.eventHandlers['decrementAsOf'] = function (app) {
    const appState = app.state;
    const appUIState = app.uiState;
    const as_of_index = appState.available_as_ofs[appUIState.selected_target_var].indexOf(appUIState.selected_as_of_date);
    if (as_of_index > 0) {
        appUIState.selected_as_of_date = appState.available_as_ofs[appUIState.selected_target_var][as_of_index - 1];  // write
        app.fetchDataUpdatePlot(true, false, true);
        app.updateTruthAsOfCheckboxText();
    }
};

App.eventHandlers['incrementAsOf'] = function (app) {
    const appState = app.state;
    const appUIState = app.uiState;
    const as_of_index = appState.available_as_ofs[appUIState.selected_target_var].indexOf(appUIState.selected_as_of_date);
    if (as_of_index < appState.available_as_ofs[appUIState.selected_target_var].length - 1) {
        appUIState.selected_as_of_date = appState.available_as_ofs[appUIState.selected_target_var][as_of_index + 1];  // write
        app.fetchDataUpdatePlot(true, false, true);
        app.updateTruthAsOfCheckboxText();
    }
};

App.eventHandlers['modelChecked'] = function (app, model, isChecked) {
    const appUIState = app.uiState;
    const isInSelectedModels = (appUIState.selected_models.indexOf(model) > -1);
    if (isChecked && !isInSelectedModels) {
        appUIState.selected_models.push(model);  // write
    } else if (!isChecked && isInSelectedModels) {
        appUIState.selected_models = appUIState.selected_models.filter(function (value) {  // write
            return value !== model;
        });  // appUIState.selected_models.remove(model);
    }
    app.fetchDataUpdatePlot(false, null, true);
};


// export

export default App;  // export the module's main entry point
