//
// Functions that abstract out DOM management for the app.
//

import {closestYear} from "./utils.js";

/**
 * UI helper that creates the two modals usedto view and edit user ensemble model.
 */
function initializeUEMModals() {
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
}


/**
 * UI helper that builds UI by adding DOM elements to componentDiv. the UI is one row with two columns: options on left
 * and the plotly plot on the right
 *
 * @param componentDiv - DIV to add the elements to
 * @param isUemEnabled - true if the Action menu should be added
 * @param taskIdsKeys - array of options.task_ids keys. used to create task rows - one per task ID
 */
function createDomElements(componentDiv, isUemEnabled, taskIdsKeys) {

    function titleCase(str) {  // per https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
        return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
    }

    function _createFormRow(selectId, label) {
        return $(
            `<div class="form-row">\n` +
            `    <label for="${selectId}" class="col-sm-4 col-form-label">${label}:</label>\n` +
            `    <div class="col-sm-8">\n` +
            `        <select id="${selectId}" class="form-control"></select>\n` +
            `    </div>\n` +
            `</div>`)
    }


    //
    // make $optionsDiv (left column)
    //
    const $optionsDiv = $('<div class="col-md-3" id="forecastViz_options"></div>');

    // add Outcome, task ID, and Interval selects (form). NB: these are unfilled; their <OPTION>s are added by
    // initializeTargetVarsUI(), initializeTaskIDsUI(), and initializeIntervalsUI(), respectively
    const $optionsForm = $('<form></form>');
    $optionsForm.append(_createFormRow('target_variable', 'Outcome'));
    taskIdsKeys.forEach(taskIdKey => {
        $optionsForm.append(_createFormRow(taskIdKey, titleCase(taskIdKey.replace(/[_-]/g, ' '))));  // replace w/spaces
    });
    $optionsForm.append(_createFormRow('intervals', 'Interval'));
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
    let optionsDivActionsDropdown;
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
    const $componentDiv = $(document.getElementById(componentDiv));
    $componentDiv.empty().append($optionsDiv, $vizDiv);
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

export {initializeUEMModals, createDomElements, initializeDateRangePicker};
