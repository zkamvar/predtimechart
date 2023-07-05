import {JSDOM} from "jsdom";
import jQueryFactory from 'jquery'; // per https://bugs.jquery.com/ticket/14549


//
// create `document` (with a 'qunit-fixture' <DIV> and a daterangepicker-related <A> in it), `$`, `Plotly`, and
// daterangepicker globals
//

const html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Title</title></head><body>\n' +
    '<a data-title="Jump to As_Of"></a>\n' +
    '<div id="qunit-fixture"></div>\n' +
    '</body></html>';

const jsdomWindow = new JSDOM(html).window;
global.window = jsdomWindow;
global.document = jsdomWindow.document;
global.$ = jQueryFactory(jsdomWindow);


const PlotlyStub = {
    numCalls: 0,  // mock-style counter for below functions
    newPlot(...args) {
        this.numCalls++;
    },
    react() {
        this.numCalls++;
    },
    relayout() {
        this.numCalls++;
    },
}
global.Plotly = PlotlyStub;


const $icon = $("[data-title='Jump to As_Of']");
$.fn.daterangepicker = function (...args) {
};
