/// <reference path="components/agGridNg2.ts" />
/// <reference path="components/agGridNg1.ts" />
/// <reference path="components/agGridWebComponent.ts" />
/// <reference path="../../typings/tsd" />

// creating the random local variable was needed to get the unit tests working.
// if not, the tests would not load as we were referencing an undefined window object
var __RANDOM_GLOBAL_VARIABLE_FSKJFHSKJFHKSDAJF: any;
if (typeof window !== 'undefined') {
    __RANDOM_GLOBAL_VARIABLE_FSKJFHSKJFHKSDAJF = window;
}

(function() {

    // Establish the root object, `window` or `exports`
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = agGrid;
        } else {
            exports = agGrid;
        }
    }

    this.agGridGlobalFunc = function() {
        console.warn('ag-Grid: agGridGlobalFunc() is no longer used. Please use "new agGrid.Grid()" to create a new grid. Check the examples in the documentation.')
    };

}).call(__RANDOM_GLOBAL_VARIABLE_FSKJFHSKJFHKSDAJF);

// how to build out the package was taken from inspecting TypeScript generated code
var ag: any;
(function (ag: any) {
    var grid: any;
    (function (grid: any) {
        var Grid = (function () {
            function Grid() {
                console.error('Error creating ag-Grid: Do not use "new ag.grid.Grid()", since ag-Grid v3.3 the way to do it is "new agGrid.Grid()"');
            }
            return Grid;
        })();
        grid.Grid = Grid;
    })(grid = ag.grid || (ag.grid = {}));
})(ag || (ag = {}));
