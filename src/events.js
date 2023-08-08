import {closestYear} from "./utils.js";

/**
 * UI helper function
 */
function addEventHandlers(app, userEnsembleModel) {
    // option, task ID, and interval selects
    $('#target_variable').change(function () {
        app.eventHandlers['targetVariableSelected'](app, this.value);
    });
    Object.keys(app.state.task_ids).forEach(function (taskIdKey) {
        const $taskIdSelect = $(`#${taskIdKey}`);  // created by `createDomElements()`
        $taskIdSelect.change(function () {
            app.eventHandlers['taskIdsSelected'](app, _selectedTaskIDs(app));
        });
    });
    $('#intervals').change(function () {
        app.eventHandlers['intervalSelected'](app, this.value);
    });

    // truth checkboxes
    $("#forecastViz_Current_Truth").change(function () {
        _setSelectedTruths(app);  // 'truthsSelected'
    });
    $("#forecastViz_Truth_as_of").change(function () {
        _setSelectedTruths(app);  // 'truthsSelected'
    });

    // Shuffle Colours button
    $("#forecastViz_shuffle").click(function () {
        app.eventHandlers['shuffleColors'](app);
    });

    // User Ensemble Model Actions dropdown button. NB: these will not be created by initialize() if !isUemEnabled,
    // but JQuery will not error if they don't exist :-)
    $("#addUserEnsemble").click(function (event) {
        event.preventDefault();
        app.eventHandlers['addUserEnsemble'](app);
    });
    $("#removeUserEnsemble").click(function (event) {
        event.preventDefault();
        app.eventHandlers['removeUserEnsemble'](app);
    });
    $("#downloadUserEnsemble").click(function (event) {
        event.preventDefault();
        app.eventHandlers['downloadUserEnsemble'](app, userEnsembleModel);
    });
    $("#infoUserEnsemble").click(function (event) {
        event.preventDefault();
        app.eventHandlers['infoUserEnsemble'](app, userEnsembleModel);
    });

    // handle #uemEditModelNameModal activity:
    $('#uemEditModelName').on('input', function () {
        app.eventHandlers['uemEditModelNameInput'](app);
    });
    $("#uemEditSaveButton").click(function () {
        const newModelName = $("#uemEditModelName").val();
        app.eventHandlers['uemEditSaveModelName'](app, userEnsembleModel, newModelName);
    });
    $("#editNameUserEnsemble").click(function (event) {
        event.preventDefault();

        // configure and show the user model name edit modal
        const modelName = userEnsembleModel.name;
        $("#uemEditModelName").val(modelName);  // initialize name to current
        $('#uemEditModelNameModal').modal('show');
    });

    // "Select Models" checkbox
    $("#forecastViz_all").change(function () {
        const $this = $(this);
        const isChecked = $this.prop('checked');
        app.eventHandlers['toggleModels'](app, isChecked);
    });

    // wire up model checkboxes
    addModelCheckEventHandler(app);  // 'modelChecked'

    // left and right buttons
    $("#decrement_as_of").click(function () {
        app.eventHandlers['decrementAsOf'](app);
    });
    $("#increment_as_of").click(function () {
        app.eventHandlers['incrementAsOf'](app);
    });

    // left and right keys
    window.addEventListener('keydown', function (event) {
        if (event.code === "ArrowLeft") {
            app.eventHandlers['decrementAsOf'](app);
        } else if (event.code === "ArrowRight") {
            app.eventHandlers['incrementAsOf'](app);
        }
    });
}


// returns the value(s) of the task ID <SELECT>(s) as an object similar to format of initial_task_ids, e.g.,
// {"scenario_id": 1, "location": "48"}
function _selectedTaskIDs(app) {
    const selectedTaskIDs = {};  // return value. filled next
    Object.keys(app.state.task_ids).forEach(function (taskIdKey) {
        const $taskIdSelect = $(`#${taskIdKey}`);  // created by `createDomElements()`
        selectedTaskIDs[taskIdKey] = $taskIdSelect.val();
    });
    return selectedTaskIDs;
}


function _setSelectedTruths(app) {
    const isCurrTruthChecked = $("#forecastViz_Current_Truth").prop('checked');
    const isAsOfTruthChecked = $("#forecastViz_Truth_as_of").prop('checked');  // ""
    const selectedTruths = [];
    if (isCurrTruthChecked) {
        selectedTruths.push('Current Truth');
    }
    if (isAsOfTruthChecked) {
        selectedTruths.push('Truth as of');
    }
    app.eventHandlers['truthsSelected'](app, selectedTruths);
}


function addModelCheckEventHandler(app) {
    $(".model-check").change(function () {
        const $this = $(this);
        const model = $this.prop('id');
        const isChecked = $this.prop('checked');
        app.eventHandlers['modelChecked'](app, model, isChecked);
    });
}

function initializeDateRangePicker(app) {
    const appState = app.state;
    const appUIState = app.uiState;

    // initialize https://www.daterangepicker.com/ . regarding the jquery selector for the above icon, the svg is:
    // <a rel="tooltip" class="modebar-btn" data-title="Jump to As_Of" data-attr="my attr" data-val="my val" data-toggle="false" data-gravity="n">
    const $icon = $("[data-title='Jump to As_Of']");  // NB: couldn't get this to work: $(".modebar-btn [data-title='Jump to As_Of']");
    const available_as_ofs = appState.available_as_ofs[appUIState.selected_target_var];
    $icon.daterangepicker({  // we use below 'apply.daterangepicker' instead of a callback to get more control, esp. to receive "today" clicks
        singleDatePicker: true,
        showDropdowns: true,
        minYear: parseInt(available_as_ofs[0].slice(0, 4)),
        maxYear: parseInt(available_as_ofs.at(-1).slice(0, 4)),
    });
    $icon.on('apply.daterangepicker', function (ev, picker) {
        // save and reset picked date to today (o/w stays on picked date)
        const pickedDate = picker.startDate.format('YYYY-MM-DD');
        picker.setStartDate(new Date());
        picker.setEndDate(new Date());

        const availableAsOfs = appState.available_as_ofs[appUIState.selected_target_var];
        const closestAsOf = closestYear(pickedDate, availableAsOfs);
        console.debug(`apply.daterangepicker: pickedDate=${pickedDate}, closestAsOf=${closestAsOf}, selected_as_of_date=${appUIState.selected_as_of_date}, diff=${closestAsOf !== appUIState.selected_as_of_date}`);

        // go to picked date if different from current
        if (closestAsOf !== appUIState.selected_as_of_date) {
            appUIState.selected_as_of_date = closestAsOf;  // write
            app.fetchDataUpdatePlot(true, false, true);
            app.updateTruthAsOfCheckboxText();
        }
    });

}


// export

export {addEventHandlers, addModelCheckEventHandler, initializeDateRangePicker}
