define([
    "angular",
    "./angularGrid"
], function(angular) {

    var gridsModule = angular.module("grids", ["angularGrid"]);

    gridsModule.controller('mainController', function($scope) {

        var colNames = ["Country","Game","Bought","Price","Test", "Station","Railway","Street","Address","Toy","Soft Box","Make and Model","Longest Day","Shortest Night"];
        var countries = ["Ireland","Spain", "United Kingdom", "France", "Germany", "Brazil", "Sweden", "Norway", "Italy", "Greece", "Iceland", "Portugal", "Malta"];
        var games = ["Chess","Cross and Circle game","Daldøs","Downfall","DVONN","Fanorona","Game of the Generals","Ghosts",
            "Abalone","Agon","Backgammon","Battleship","Blockade","Blood Bowl","Bul","Camelot","Checkers",
            "Go","Gipf","Guess Who?","Hare and Hounds","Hex","Hijara","Isola","Janggi (Korean Chess)","Le Jeu de la Guerre",
            "Patolli","Plateau","PÜNCT","Rithmomachy","Sáhkku","Senet","Shogi","Space Hulk","Stratego","Sugoroku",
            "Tâb","Tablut","Tantrix","Wari","Xiangqi (Chinese chess)","YINSH","ZÈRTZ","Kalah","Kamisado","Liu po",
            "Lost Cities","Mad Gab","Master Mind","Nine Men's Morris","Obsession","Othello", null, undefined
        ];
        var booleanValues = [true, "true", false, "false", null, undefined, ""];
        var testValues = ["", null, undefined, "String A", "String B", 111, 222];

        $scope.colCount = 20;
        $scope.rowCount = 100;

        $scope.width = "100%";
        $scope.height = "100%";
        $scope.style = "ag-fresh";

        $scope.angularGrid = {
            columnDefs: [],
            rowData: [],
            pinnedColumnCount: 2, //and integer, zero or more, default is 0
            rowHeight: 25, // defaults to 25, can be any integer
            enableColResize: true, //one of [true, false]
            enableSorting: true, //one of [true, false]
            enableFilter: true, //one of [true, false]
            rowSelection: "single", // one of ['single','multiple']
            rowSelected: function(row) {console.log("Callback rowSelected: " + row); }, //callback when row selected
            selectionChanged: function() {console.log("Callback selectionChanged"); } //callback when selection changed
        };

        createCols();
        createData();

        $scope.onRowCountChanged = function() {
            createData();
            $scope.angularGrid.api.onNewRows();
        };

        $scope.onColCountChanged = function() {
            createCols();
            //$scope.angularGrid.pinnedColumnCount =
            $scope.angularGrid.api.onNewCols();
        };

        function createCols() {
            var columns = [];
            var colCount = parseInt($scope.colCount);
            for (var col = 0; col<colCount; col++) {
                var colName = colNames[col % colNames.length];
                var cellRenderer = undefined;
                var cellCss = undefined;
                var comparator = undefined;
                var filterCellRenderer = undefined;
                var cellCssFunc = undefined;
                var filterCellHeight = undefined;
                if (colName=="Bought") {
                    cellRenderer = booleanCellRenderer;
                    cellCss = {"text-align": "center"};
                    comparator = booleanComparator;
                    filterCellRenderer = booleanFilterCellRenderer;
                } else if (colName=="Price") {
                    cellRenderer = currencyRenderer;
                    filterCellRenderer = currencyRenderer;
                    cellCss = {"text-align": "right"};
                    cellCssFunc = currencyCssFunc;
                } else if (colName=="Country") {
                    cellRenderer = countryCellRenderer;
                    filterCellRenderer = countryFilterCellRenderer;
                    filterCellHeight = 30;
                }
                var colDef = {displayName: colName, field: "col"+col, width: 200,
                    cellRenderer: cellRenderer, filterCellRenderer: filterCellRenderer, filterCellHeight: filterCellHeight,
                    comparator: comparator, cellCss: cellCss, cellCssFunc: cellCssFunc};
                columns.push(colDef);
            }
            $scope.angularGrid.columnDefs = columns;
        }

        function createData() {
            var rowCount = parseInt($scope.rowCount);
            var colCount = parseInt($scope.colCount);
            var data = [];
            for (var row = 0; row<rowCount; row++) {
                var rowItem = {};
                for (var col = 0; col<colCount; col++) {
                    var value;
                    if (colNames[col % colNames.length]==="Country") {
                        value = countries[row % countries.length];
                    } else if (colNames[col % colNames.length]==="Game") {
                        value = games[row % games.length];
                    } else if (colNames[col % colNames.length]==="Bought") {
                        //this is the sample boolean value
                        value = booleanValues[row % booleanValues.length];
                    } else if (colNames[col % colNames.length]==="Price") {
                        //generate a number between -20 and 80, to two decimal places
                        value = ((Math.round(Math.random()*10000))/100) - 20;
                    } else if (colNames[col % colNames.length]==="Test") {
                        //generate a number between -20 and 80, to two decimal places
                        value = testValues[row % testValues.length];
                    } else {
                        var randomBit = Math.random().toString().substring(2,5);
                        value = colNames[col % colNames.length]+"-"+randomBit +" - (" +row+","+col+")";
                    }
                    rowItem["col"+col] = value;
                }
                data.push(rowItem);
            }
            $scope.angularGrid.rowData = data;
        }

    });

    function currencyCssFunc(value) {
        if (value!==null && value!==undefined && value<0) {
            return {"color": "red"};
        } else {
            return null;
        }
    }

    function currencyRenderer(value)  {
        if (value===null || value===undefined) {
            return null;
        } else {
            var decimalSeparator = Number("1.2").toLocaleString().substr(1,1);

            var amountWithCommas = value.toLocaleString();
            var arParts = String(amountWithCommas).split(decimalSeparator);
            var intPart = arParts[0];
            var decPart = (arParts.length > 1 ? arParts[1] : '');
            decPart = (decPart + '00').substr(0,2);

            return '£ ' + intPart + decimalSeparator + decPart;
        }
    }

    function booleanComparator(value1, value2) {
        var value1Cleaned = booleanCleaner(value1);
        var value2Cleaned = booleanCleaner(value2);
        var value1Ordinal = value1Cleaned===true ? 0 : (value1Cleaned===false ? 1 : 2);
        var value2Ordinal = value2Cleaned===true ? 0 : (value2Cleaned===false ? 1 : 2);
        return value1Ordinal - value2Ordinal;
    }

    function booleanCellRenderer(value) {
        var valueCleaned = booleanCleaner(value);
        if (valueCleaned===true) {
            //this is the unicode for tick character
            return "<span title='true'>&#10004;</span>";
        } else if (valueCleaned===false) {
            //this is the unicode for cross character
            return "<span title='false'>&#10006;</span>";
        } else {
            return null;
        }
    }

    function booleanFilterCellRenderer(value) {
        var valueCleaned = booleanCleaner(value);
        if (valueCleaned===true) {
            //this is the unicode for tick character
            return "&#10004;";
        } else if (valueCleaned===false) {
            //this is the unicode for cross character
            return "&#10006;";
        } else {
            return "(empty)";
        }
    }

    function booleanCleaner(value) {
        if (value==="true" || value===true || value===1) {
            return true;
        } else if (value==="false" || value===false || value===0) {
            return false;
        } else {
            return null;
        }
    }

    function countryCellRenderer(value) {
        //get flags from here: http://www.freeflagicons.com/
        if (value==="" || value===undefined || value===null) {
            return null;
        } else {
            var flag = "<img border='0' width='20' height='15' src='http://www.angulargrid.com/flags/"+value.toLowerCase().replace(" ", "_")+".png'>";
            var link = "<a href='http://en.wikipedia.org/wiki/" + value + "'>"+value+"</a>";
            return flag + link;
        }
    }

    function countryFilterCellRenderer(value) {
        if (value==="" || value===undefined || value===null) {
            return "(no country)";
        } else {
            var flag = "<img border='0' width='40' height='25' src='http://www.angulargrid.com/flags/"+value.toLowerCase().replace(" ", "_")+".png'>";
            return "<span style='font-weight: bold; font-size: 14px;'>" + flag + value + "</span>";
        }
    }

    angular.bootstrap(document, ['grids']);

});