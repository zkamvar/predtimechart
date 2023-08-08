//
// Functions that abstract out plotly functionality for the app.
//

function getPlotlyLayout(app) {
    if (app.state.target_variables.length === 0) {
        return {};
    }

    const variable = app.state.target_variables.filter((obj) => obj.value === app.uiState.selected_target_var)[0].plot_text;
    const taskIdVals = Object.values(app.selectedTaskIDs());  // e.g., {"scenario_id": 1, "location": "48"} -> [1, "48]
    return {
        autosize: true,
        showlegend: false,
        title: {
            text: `Forecasts of ${variable} <br> in ${taskIdVals} as of ${app.uiState.selected_as_of_date}`,
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
}


function getPlotlyData(app) {
    const state = app.state;
    const uiState = app.uiState;
    let pd = [];
    if (uiState.selected_truth.includes('Current Truth') && Object.keys(state.current_truth).length !== 0) {
        pd.push({
            x: state.current_truth.date,
            y: state.current_truth.y,
            type: 'scatter',
            mode: 'lines',
            name: 'Current Truth',
            marker: {color: 'darkgray'}
        })
    }
    if (uiState.selected_truth.includes('Truth as of') && Object.keys(state.as_of_truth).length !== 0) {
        pd.push({
            x: state.as_of_truth.date,
            y: state.as_of_truth.y,
            type: 'scatter',
            mode: 'lines',
            opacity: 0.5,
            name: `Truth as of ${uiState.selected_as_of_date}`,
            marker: {color: 'black'}
        })
    }

    let pd0 = []
    if (state.forecasts.length !== 0) {
        // add the line for predictive medians
        pd0 = Object.keys(state.forecasts).map((model) => {
            if (uiState.selected_models.includes(model)) {
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
                    line: {color: uiState.colors[index]},
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
            if (uiState.selected_models.includes(model)) {
                const index = state.models.indexOf(model)
                const is_hosp = uiState.selected_target_var === 'hosp'
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
                    line: {color: uiState.colors[index]}
                }

                if (uiState.selected_interval === '50%') {
                    lower_quantile = 'q0.25'
                    upper_quantile = 'q0.75'
                } else if (uiState.selected_interval === '95%') {
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
                        fillcolor: uiState.colors[index],
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
}


// export

export {getPlotlyLayout, getPlotlyData}
