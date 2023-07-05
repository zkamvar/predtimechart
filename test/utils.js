import {closestYear} from '../src/utils.js';

const {test} = QUnit;


//
// _closestYear() tests
//

QUnit.module('_closestYear()');


test('cases', assert => {
    const availableYears = ["2020-03-14", "2020-03-21", "2021-08-07", "2023-03-04", "2023-03-11"];
    const year_exp_closest_pairs = [   // cases:
        ["2020-03-13", "2020-03-14"],  // < first
        ["2020-03-14", "2020-03-14"],  // == first
        ["2021-08-06", "2021-08-07"],  // middle not ==
        ["2021-08-07", "2021-08-07"],  // middle ==
        ["2023-03-11", "2023-03-11"],  // == last
        ["2023-03-12", "2023-03-11"],  // > last
    ];
    year_exp_closest_pairs.forEach(year_exp_closest_pair => {
        const act_closest = closestYear(year_exp_closest_pair[0], availableYears);
        assert.deepEqual(act_closest, year_exp_closest_pair[1]);
    });
});
