import {_isInvalidUemName, download} from "./utils.js";


/**
 * UI helper function
 */
function addEventHandlers(app, userEnsembleModel) {
    // option, task ID, and interval selects
    $('#target_variable').on('change', function () {
        app.state.selected_target_var = this.value;
        app.fetchDataUpdatePlot(true, true, false);
    });
    Object.keys(app.state.task_ids).forEach(function (taskIdKey) {
        const $taskIdSelect = $(`#${taskIdKey}`);  // created by _createUIElements()
        $taskIdSelect.on('change', function () {
            app.fetchDataUpdatePlot(true, true, false);
        });
    });
    $('#intervals').on('change', function () {
        app.state.selected_interval = this.value;
        app.fetchDataUpdatePlot(false, null, true);
    });

    // truth checkboxes
    $("#forecastViz_Current_Truth").change(function () {
        _setSelectedTruths(app);
    });
    $("#forecastViz_Truth_as_of").change(function () {
        _setSelectedTruths(app);
    });

    // Shuffle Colours button
    $("#forecastViz_shuffle").click(function () {
        app.state.colors = app.state.colors.sort(() => 0.5 - Math.random())
        app.updateModelsList();
        app.updatePlot(true);
    });

    // User Ensemble Model Actions dropdown button. NB: these will not be created by initialize() if !isUemEnabled,
    // but JQuery will not error if they don't exist :-)
    $("#addUserEnsemble").click(function (event) {
        console.debug("addUserEnsemble click", app.state.selected_models);
        event.preventDefault();
        app.removeUserEnsembleModel();
        app.addUserEnsembleModel();
        app.updateModelsList();
        app.updatePlot(true);
        $("#removeUserEnsemble").removeClass('disabled');    // enable
        $("#downloadUserEnsemble").removeClass('disabled');  // ""
        $("#infoUserEnsemble").removeClass('disabled');      // ""
        $("#editNameUserEnsemble").addClass('disabled');     // disable
    });
    $("#removeUserEnsemble").click(function (event) {
        event.preventDefault();
        app.removeUserEnsembleModel();
        app.updateModelsList();
        app.updatePlot(true);
        $("#removeUserEnsemble").addClass('disabled');       // disable
        $("#downloadUserEnsemble").addClass('disabled');     // ""
        $("#infoUserEnsemble").addClass('disabled');         // ""
        $("#editNameUserEnsemble").removeClass('disabled');  // enable
    });
    $("#downloadUserEnsemble").click(function (event) {
        console.debug("#downloadUserEnsemble click", userEnsembleModel.models, app.state.selected_target_var, app.state.selected_as_of_date);
        event.preventDefault();
        let fileName = '';
        app._calcUemForecasts(userEnsembleModel.models, app.state.selected_target_var, app.state.selected_as_of_date, userEnsembleModel.name)  // Promise
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
        const modelName = userEnsembleModel.name;
        const componentModels = userEnsembleModel.models.join(", ");
        const lastError = (userEnsembleModel.lastError === null) ? '(no errors)' : userEnsembleModel.lastError;
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
    });
    $("#uemEditSaveButton").click(function () {
        // save the new name (assumed valid)
        const newModelName = $("#uemEditModelName").val();
        userEnsembleModel.name = newModelName;
        console.info(`saved new user ensemble model name: '${newModelName}'`);
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
        if (isChecked) {
            app.state.last_selected_models = app.state.selected_models;
            app.state.selected_models = app.selectableModels();
        } else {
            app.state.selected_models = app.state.last_selected_models;
        }
        app.checkModels(app.state.selected_models);
        app.updatePlot(true);
    });

    // wire up model checkboxes
    addModelCheckEventHandler(app);

    // left and right buttons
    $("#decrement_as_of").click(function () {
        app.decrementAsOf();
    });
    $("#increment_as_of").click(function () {
        app.incrementAsOf();
    });

    // left and right keys
    window.addEventListener('keydown', function (event) {
        if (event.code === "ArrowLeft") {
            app.decrementAsOf();
        } else if (event.code === "ArrowRight") {
            app.incrementAsOf();
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
    app.state.selected_truth = selectedTruths;
    app.fetchDataUpdatePlot(false, null, true);
}


function addModelCheckEventHandler(app) {
    $(".model-check").change(function () {
        const $this = $(this);
        const model = $this.prop('id');
        const isChecked = $this.prop('checked');
        const isInSelectedModels = (app.state.selected_models.indexOf(model) > -1);
        if (isChecked && !isInSelectedModels) {
            app.state.selected_models.push(model);
        } else if (!isChecked && isInSelectedModels) {
            app.state.selected_models = app.state.selected_models.filter(function (value) {
                return value !== model;
            });  // app.state.selected_models.remove(model);
        }
        app.fetchDataUpdatePlot(false, null, true);
    });
}


// export

export {addEventHandlers, addModelCheckEventHandler}
