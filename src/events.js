/**
 * UI helper function
 */
function addEventHandlers(app, userEnsembleModel) {
    // option, task ID, and interval selects
    $('#target_variable').change(function () {
        app.eventHandlers['targetVariableSelected'](app, this.value);
    });
    Object.keys(app.state.task_ids).forEach(function (taskIdKey) {
        const $taskIdSelect = $(`#${taskIdKey}`);  // created by _createUIElements()
        $taskIdSelect.change(function () {
            app.eventHandlers['taskIdSelected'](app, this.value);
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
        app.eventHandlers['selectModels'](app, isChecked);
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


// export

export {addEventHandlers, addModelCheckEventHandler}
