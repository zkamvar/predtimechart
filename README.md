# predtimechart

A JavaScript (ES6 ECMAScript) module for forecast visualization.

# intro

TBD

# data format

TBD

# Usage

In your HTML file, load the required CSS and JavaScript files:

1. In the `<head>`, load Bootstrap 4 and hub-vis files:

```html
<!-- Bootstrap 4 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.11.0/umd/popper.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.1.3/dist/css/bootstrap.min.css">
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js"></script>

<!-- zoltar_viz -->
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
