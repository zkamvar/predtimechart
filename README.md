# predtimechart

A JavaScript (ES6 ECMAScript) module for forecast visualization.

# Steps to use the component

To use the component in your app, you'll need to add the following to your HTML:

1. add `<script>` and stylesheet `<link>` tags to the `<head>`
2. add a `<div>` to the `<body>` for the component to fill
3. add a `<script>` in the `<body>` that initializes the component via the (default) `App` object that's exported

See the "HTML file example" section below for an example, and see the "JavaScript API" section for how to initialize the component.

# HTML file example

In your HTML file, load the required CSS and JavaScript files:

1. In the `<head>`, load Bootstrap 4 and hub-vis files:

```html
<!-- Bootstrap 4 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.11.0/umd/popper.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.1.3/dist/css/bootstrap.min.css">
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js"></script>

<!-- predtimechart -->
<script src="https://cdn.plot.ly/plotly-2.12.1.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.3/moment.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/reichlab/predtimechart@1.0.0/predtimechart.css">
```

2. In the `<body>`, add the row `<div>` that will hold the component:

```html

<div id="forecastViz_row" class="row">
</div>
```

3. In the `<body>`, load and use the hub-viz module:

```html

<script type="module">
    // import the module's entry point (the `App` object)
    import App from 'https://cdn.jsdelivr.net/gh/reichlab/predtimechart@1.0.0/predtimechart.js';

    // set up _fetchData and options
    function _fetchData(isForecast, targetKey, unitAbbrev, referenceDate) { ...
    }

    const options = {...};

    // initialize the component
    App.initialize('forecastViz_row', _fetchData, options);
</script>
```

# JavaScript API

The component is accessed via the `App` object, and is initialized via the `App.initialize()` function. After that, everything else is taken care of by the app. `App.initialize(componentDiv, _fetchData, options)` takes these args:

- `componentDiv`: `id` of the empty `<div>` to place the component into.
- `fetchData`: function to retrieve truth and forecast data. It is called whenever the plot needs updating. See the "fetchData data format" section for details. It takes these args:
    - `isForecast`: `boolean` indicating type of data to retrieve. `true` means retrieve forecast data and `false` means get truth data.
    - `targetKey`: `string` naming the target of interest. Must be one of the values in the options object's `target_variables` value.
    - `unitAbbrev`: "" unit "". Must be one of the values in the options object's `units` value.
    - `referenceDate`: "" reference date "". Must be one of the values in the options object's `available_as_ofs` value.
- `options`: `object` that contains initialization data. See the "Options object" section for details.

# Options object

The component is initialized by a JavaScript object with the following keys and values. See the "Example options object" for a detailed example.

- 'target_variables': `array` of `object`s defining the target variables in the data. Each object contains three keys:
    - 'value': used as the main value that's passed around for the target
    - 'text': human-readable text
    - 'plot_text': plot text (purpose: TBD)
- 'initial_target_var': `target_variables` `value` key to use for the initial plot
- 'units': `array` of `object`s defining the units (typically locations) in the data. Each object contains two keys:
  - 'value': used as the main value that's passed around for the unit
  - 'text': human-readable text
- 'initial_unit':  `units` `value` key to use for the initial plot
- 'intervals': `array` of one or more integers between 0 and 100 inclusive, representing percentages (purpose: TBD)
- 'init_interval': `intervals` value to use for the initial plot
- 'available_as_ofs': `object` that maps `target_variables` `value` to an `array` of dates that have truth and/or forecasts available
- 'current_date':  `available_as_ofs` `value` key to use for the initial plot
- 'models': `array` of model names (`string`s) that provide data
- 'initial_checked_models': `models` value(s) to use for the initial plot
- 'disclaimer': `string` providing any important information users should know

## Example options object

Here's a real-world example from the [COVID-19 Forecast Hub](https://covid19forecasthub.org/) project. Only the first two items in the lists are shown.

```json
{
  "target_variables": [
    {
      "value": "day_ahead_cumulative_deaths",
      "text": "day ahead cumulative deaths",
      "plot_text": "day ahead cumulative deaths"
    },
    {
      "value": "day_ahead_incident_deaths",
      "text": "day ahead incident deaths",
      "plot_text": "day ahead incident deaths"
    },
    "..."
  ],
  "initial_target_var": "week_ahead_incident_deaths",
  "units": [
    {"value": "US", "text": "US"},
    {"value": "01", "text": "Alabama"},
    "..."
  ],
  "initial_unit": "US",
  "intervals": ["0%", "50%", "95%"],
  "init_interval": "95%",
  "available_as_ofs": {
    "day_ahead_cumulative_deaths": [
      "2020-03-15",
      "2020-03-22",
      "..."
    ],
    "day_ahead_incident_deaths": [
      "2020-03-15",
      "2020-03-22",
      "..."
    ],
    "...": "..."
  },
  "current_date": "2022-10-22",
  "models": [
    "COVIDhub-baseline",
    "COVIDhub-ensemble",
    "..."
  ],
  "initial_checked_models": [
    "COVIDhub-baseline",
    "COVIDhub-ensemble"
  ],
  "disclaimer": "Most forecasts have failed to reliably predict rapid changes in the trends of reported cases and hospitalizations..."
}
```

# fetchData data format

As described above, the `fetchData(isForecast, targetKey, unitAbbrev, referenceDate)` function passed to `App.initialize()` is responsible for returning truth and forecast data as directed by the `isForecast` arg. It uses the other three args to retrieve and return the requested data. The data is in the following formats.


## fetchData truth data format

Truth data is represented as an `object` with x/y pairs represented as columns, where x=date and y=truth_value. The dates must correspond to those in the options object's `available_as_ofs`. For example:

```json
{
  "date": ["2020-03-15", "2020-03-22", "..."],
  "y": [0, 15, "..."]
}
```

## fetchData forecasts data format

Forecast data is an `object` with one entry for each model in the the options object's `models`, each of which is in turn an `object` with entries for target end date of the forecast and the quantiles required to use to display point predictions and 50% or 95% prediction intervals. For example:

```json
{
  "UChicagoCHATTOPADHYAY-UnIT": {
    "target_end_date": ["2021-09-11", "2021-09-18"],
    "q0.025": [1150165.71, 1176055.78],
    "q0.25": [1151044.42, 1178626.67],
    "q0.5": [1151438.21, 1179605.9],
    "q0.75": [1152121.55, 1180758.16],
    "q0.975": [1152907.55, 1182505.14]
  },
  "USC-SI_kJalpha": {
    "target_end_date": ["2021-09-11", "2021-09-18"],
    "q0.025": [941239.7761, 775112.557],
    "q0.25": [1010616.1863, 896160.705],
    "q0.5": [1149400.162, 1137280.4614],
    "q0.75": [1313447.0159, 1461013.716],
    "q0.975": [1456851.692, 1771312.0932]
  },
  "...": "..."
}
```
