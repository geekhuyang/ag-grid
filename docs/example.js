
document.addEventListener('DOMContentLoaded', function() {
    gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);
});

var gridDiv;

var colNames = ["Station","Railway","Street","Address","Toy","Soft Box","Make and Model","Longest Day","Shortest Night"];

var countries = [
    {country: "Ireland", continent: "Europe", language: "English"},
    {country: "Spain", continent: "Europe", language: "Spanish"},
    {country: "United Kingdom", continent: "Europe", language: "English"},
    {country: "France", continent: "Europe", language: "French"},
    {country: "Germany", continent: "Europe", language: "(other)"},
    {country: "Sweden", continent: "Europe", language: "(other)"},
    {country: "Norway", continent: "Europe", language: "(other)"},
    {country: "Italy", continent: "Europe", language: "(other)"},
    {country: "Greece", continent: "Europe", language: "(other)"},
    {country: "Iceland", continent: "Europe", language: "(other)"},
    {country: "Portugal", continent: "Europe", language: "Portuguese"},
    {country: "Malta", continent: "Europe", language: "(other)"},
    {country: "Brazil", continent: "South America", language: "Portuguese"},
    {country: "Argentina", continent: "South America", language: "Spanish"},
    {country: "Colombia", continent: "South America", language: "Spanish"},
    {country: "Peru", continent: "South America", language: "Spanish"},
    {country: "Venezuela", continent: "South America", language: "Spanish"},
    {country: "Uruguay", continent: "South America", language: "Spanish"}
];

var games = ["Chess","Cross and Circle game","Daldøs","Downfall","DVONN","Fanorona","Game of the Generals","Ghosts",
    "Abalone","Agon","Backgammon","Battleship","Blockade","Blood Bowl","Bul","Camelot","Checkers",
    "Go","Gipf","Guess Who?","Hare and Hounds","Hex","Hijara","Isola","Janggi (Korean Chess)","Le Jeu de la Guerre",
    "Patolli","Plateau","PÜNCT","Rithmomachy","Sáhkku","Senet","Shogi","Space Hulk","Stratego","Sugoroku",
    "Tâb","Tablut","Tantrix","Wari","Xiangqi (Chinese chess)","YINSH","ZÈRTZ","Kalah","Kamisado","Liu po",
    "Lost Cities","Mad Gab","Master Mind","Nine Men's Morris","Obsession","Othello"
];
var booleanValues = [true, "true", false, "false", null, undefined, ""];

var firstNames = ["Sophie","Isabelle","Emily","Olivia","Lily","Chloe","Isabella",
    "Amelia","Jessica","Sophia","Ava","Charlotte","Mia","Lucy","Grace","Ruby",
    "Ella","Evie","Freya","Isla","Poppy","Daisy","Layla"];
var lastNames = ["Beckham","Black","Braxton","Brennan","Brock","Bryson","Cadwell",
    "Cage","Carson","Chandler","Cohen","Cole","Corbin","Dallas","Dalton","Dane",
    "Donovan","Easton","Fisher","Fletcher","Grady","Greyson","Griffin","Gunner",
    "Hayden","Hudson","Hunter","Jacoby","Jagger","Jaxon","Jett","Kade","Kane",
    "Keating","Keegan","Kingston","Kobe"];

var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

var dataSize = '10x22';

var size = 'fill'; // model for size select
var width = '100%'; // the div gets it's width and height from here
var height = '100%';

var style = 'ag-fresh';
var rowSelection = 'checkbox';

var groupColumn = {
    headerName: "Group",
    width: 200,
    field: 'name',
    cellRenderer: {
        renderer: "group",
        checkbox: true
    }
};

var gridOptions = {
    debug: true,
    //rowsBuffer: 1,
    columnDefs: [],
    //singleClickEdit: true,
    rowData: null,
    rowsAlreadyGrouped: false, // set this to true, if you are passing in data alrady in nodes and groups
    groupKeys: undefined, //set as string of keys eg ["region","country"],
//            groupUseEntireRow: true, //one of [true, false]
//        groupDefaultExpanded: 9999, //one of [true, false], or an integer if greater than 1
//            headerHeight: 100, // set to an integer, default is 25, or 50 if grouping columns
//        groupSuppressAutoColumn: true,
    //groupSuppressBlankHeader: true,
    groupIncludeFooter: false,
    groupHideGroupColumns: true,
    //unSortIcon: true,
    //rowHeight: 30, // defaults to 25, can be any integer
    enableColResize: true, //one of [true, false]
    enableSorting: true, //one of [true, false]
    enableFilter: true, //one of [true, false]
    rowSelection: "multiple", // one of ['single','multiple'], leave blank for no selection
    rowDeselection: true,
    groupSelectsChildren: true, // one of [true, false]
    suppressRowClickSelection: true, // if true, clicking rows doesn't select (useful for checkbox selection)
    groupColumnDef: groupColumn,
    //suppressCellSelection: true,
    //suppressMultiSort: true,
    showToolPanel: false,
    //toolPanelSuppressGroups: true,
    //toolPanelSuppressValues: true,
    //groupSuppressAutoColumn: true,
    //groupAggFunction: groupAggFunction,
    //groupAggFields: ['bankBalance','totalWinnings'],
    checkboxSelection: function(params) {
        // we show checkbox selection in the first column, unless we are grouping,
        // as the group column is configured to always show selection
        var isGrouping = gridOptions.columnApi.getRowGroupColumns().length > 0;
        return params.colIndex === 0 && !isGrouping;
    },
    //forPrint: true,
    //rowClass: function(params) { return (params.data.country === 'Ireland') ? "theClass" : null; },
    //headerCellRenderer: headerCellRenderer_text,
    //headerCellRenderer: headerCellRenderer_dom,
    onRowSelected: rowSelected, //callback when row selected
    onRowDeselected: rowDeselected, //callback when row selected
    onSelectionChanged: selectionChanged, //callback when selection changed,
    icons: {
        //menu: '<i class="fa fa-bars"/>',
        //columnVisible: '<i class="fa fa-eye"/>',
        //columnHidden: '<i class="fa fa-eye-slash"/>',
        columnRemoveFromGroup: '<i class="fa fa-remove"/>',
        filter: '<i class="fa fa-filter"/>',
        sortAscending: '<i class="fa fa-long-arrow-down"/>',
        sortDescending: '<i class="fa fa-long-arrow-up"/>',
        groupExpanded: '<i class="fa fa-minus-square-o"/>',
        groupContracted: '<i class="fa fa-plus-square-o"/>',
        columnGroupOpened: '<i class="fa fa-minus-square-o"/>',
        columnGroupClosed: '<i class="fa fa-plus-square-o"/>'
    },

    getBusinessKeyForNode: function(node) {
        if (node.data) {
            return node.data.name;
        } else {
            return '';
        }
    },
    // isScrollLag: function() { return false; },
    //suppressScrollLag: true,

    // callback when row clicked
    onRowClicked: function(params) {
        console.log("Callback onRowClicked: " + (params.data?params.data.name:null) + " - " + params.event);
    },
    onRowDoubleClicked: function(params) {
        console.log("Callback onRowDoubleClicked: " + params.data.name + " - " + params.event);
    },
    // callback when cell clicked
    onCellClicked: function(params) {
        console.log("Callback onCellClicked: " + params.value + " - " + params.colDef.field + ' - ' + params.event);
    },
    // callback when cell double clicked
    onCellDoubleClicked:  function(params) {
        console.log("Callback onCellDoubleClicked: " + params.value + " - " + params.colDef.field + ' - ' + params.event);
    },
    // callback when cell right clicked
    onCellContextMenu:  function(params) {
        console.log("Callback onCellContextMenu: " + params.value + " - " + params.colDef.field + ' - ' + params.event);
    },
    onCellFocused: function(params) {
        console.log('Callback onCellFocused: ' + params.rowIndex + " - " + params.colIndex);
    },
    onReady: function(event) {
        console.log('Callback onReady: api = ' + event.api);
    },
    onGridSizeChanged: function(event) {
        console.log('Callback onGridSizeChanged: clientWidth = ' + event.clientWidth + ', clientHeight = ' + event.clientHeight);
    },
    onRowGroupOpened: function(event) {
        console.log('Callback onRowGroupOpened: node = ' + event.node.key + ', ' + event.node.expanded);
    }
};

var firstColumn = {
    headerName: "Name",
    field: "name",
    width: 200,
    editable: true,
    filter: PersonFilter,
    icons: {
        sortAscending: '<i class="fa fa-sort-alpha-asc"/>',
        sortDescending: '<i class="fa fa-sort-alpha-desc"/>'
    }
};

//var groupColumn = {
//    headerName: "Name", field: "name", headerGroup: 'Participant', width: 200, editable: true, filter: PersonFilter,
//    cellRenderer: {
//        renderer: "group",
//        checkbox: true
//    }
//};

var defaultCols = [
    //{headerName: "", valueGetter: "node.id", width: 20}, // this row is for showing node id, handy for testing
    {
        // column group 'Participant
        headerName: 'Participant',
        children: [
            firstColumn,
            {headerName: "Country", field: "country", width: 150, editable: true,
                cellRenderer: countryCellRenderer, filter: 'set',
                floatCell: true,
                filterParams: {
                    cellRenderer: countryCellRenderer,
                    cellHeight: 20,
                    newRowsAction: 'keep'
                },
                icons: {
                    sortAscending: '<i class="fa fa-sort-alpha-asc"/>',
                    sortDescending: '<i class="fa fa-sort-alpha-desc"/>'
                }
            },
            {headerName: "Language", field: "language", width: 150, editable: true, filter: 'set',
                cellRenderer: languageCellRenderer,
                headerTooltip: "Example tooltip for Language",
                filterParams: {newRowsAction: 'keep'},
                icons: {
                    sortAscending: '<i class="fa fa-sort-alpha-asc"/>',
                    sortDescending: '<i class="fa fa-sort-alpha-desc"/>'
                }
            }
        ]
    },
    {
        // column group 'Game of Choice'
        headerName: 'Game of Choice',
        children: [
            {headerName: "Game of Choice", field: "game", width: 180, editable: true, filter: 'set',
                cellClass: function() { return 'alphabet'; },
                icons: {
                    sortAscending: '<i class="fa fa-sort-alpha-asc"/>',
                    sortDescending: '<i class="fa fa-sort-alpha-desc"/>'
                }
            },
            {headerName: "Bought", field: "bought", filter: 'set', editable: true, width: 100,
                cellRenderer: booleanCellRenderer, cellStyle: {"text-align": "center"}, comparator: booleanComparator,
                floatCell: true,
                filterParams: {newRowsAction: 'keep', cellRenderer: booleanFilterCellRenderer}},
        ]
    },
    {
        // column group 'Performance'
        headerName: 'Performance',
        children: [
            {headerName: "Bank Balance", field: "bankBalance", width: 150, editable: true,
                filter: WinningsFilter, cellRenderer: currencyRenderer, cellStyle: currencyCssFunc,
                filterParams: {cellRenderer: currencyRenderer},
                icons: {
                    sortAscending: '<i class="fa fa-sort-amount-asc"/>',
                    sortDescending: '<i class="fa fa-sort-amount-desc"/>'
                }
            },
            {headerName: "Extra Info 1", columnGroupShow: 'open', width: 150, editable: false,
                suppressSorting: true, suppressMenu: true, cellStyle: {"text-align": "right"},
                cellRenderer: function() { return 'Abra...'; } },
            {headerName: "Extra Info 2", columnGroupShow: 'open', width: 150, editable: false,
                suppressSorting: true, suppressMenu: true, cellStyle: {"text-align": "left"},
                cellRenderer: function() { return '...cadabra!'; } },
        ]
    },
    {headerName: "Rating", field: "rating", width: 100, editable: true, cellRenderer: ratingRenderer,
        floatCell: true,
        filterParams: {cellRenderer: ratingFilterRenderer}
    },
    {headerName: "Total Winnings", field: "totalWinnings", filter: 'number',
        editable: true, newValueHandler: numberNewValueHandler, width: 150,
        cellRenderer: currencyRenderer, cellStyle: currencyCssFunc,
        icons: {
            sortAscending: '<i class="fa fa-sort-amount-asc"/>',
            sortDescending: '<i class="fa fa-sort-amount-desc"/>'
        }
    }
];
//put in the month cols
var monthGroup = {
    headerName: 'Monthly Breakdown',
    children: []
};
defaultCols.push(monthGroup);
months.forEach(function(month) {
    monthGroup.children.push({
        headerName: month, field: month.toLocaleLowerCase(),
        width: 100, filter: 'number', editable: true,
        cellClassRules: {
            'good-score': 'x > 50000',
            'bad-score': 'x < 10000'
        },
        newValueHandler: numberNewValueHandler, cellRenderer: currencyRenderer,
        filterCellRenderer: currencyRenderer,
        cellStyle: {"text-align": "right"}})
});

gridOptions.columnDefs = createCols();
gridOptions.rowData = createData();

//setInterval(function() {
//    $scope.gridOptions.api.ensureIndexVisible(Math.random() * 100000);
//}, 1000);

function onDataSizeChanged(newDataSize) {
    dataSize = newDataSize;
    gridOptions.api.showLoadingOverlay();
    setTimeout( function () {
        var colDefs = createCols();
        var data = createData();
        gridOptions.api.setColumnDefs(colDefs);
        gridOptions.api.setRowData(data);
    });
}

function toggleToolPanel() {
    var showing = gridOptions.api.isToolPanelShowing();
    gridOptions.api.showToolPanel(!showing);
}

function getColCount() {
    switch (dataSize) {
        case '10x100': return 100;
        default: return 22;
    }
}

function getRowCount() {
    switch (dataSize) {
        case '100x22': return 100000;
        default: return 1000;
    }
}

function createCols() {
    var colCount = getColCount();
    // start with a copy of the default cols
    var columns = defaultCols.slice(0, colCount);

    // there are 22 cols by default
    for (var col = 22; col<colCount; col++) {
        var colName = colNames[col % colNames.length];
        var colDef = {headerName: colName, field: "col"+col, width: 200, editable: true};
        columns.push(colDef);
    }

    return columns;
}

function createData() {
    var rowCount = getRowCount();
    var colCount = getColCount();
    var data = [];
    for (var row = 1; row<=rowCount; row++) {
        if (row%10000===0) {
            console.log('created ' + row + ' rows');
        }
        var rowItem = {};

        //create data for the known columns
        var countryData = countries[row % countries.length];
        rowItem.country = countryData.country;
        rowItem.continent = countryData.continent;
        rowItem.language = countryData.language;

        var firstName = firstNames[row % firstNames.length];
        var lastName = lastNames[row % lastNames.length];
        rowItem.name = firstName + " " + lastName;

        rowItem.game = games[row % games.length];
        rowItem.bankBalance = ((Math.round(Math.random()*10000000))/100) - 3000;
        rowItem.rating = (Math.round(Math.random()*5));
        rowItem.bought = booleanValues[row % booleanValues.length];

        var totalWinnings = 0;
        months.forEach(function(month) {
            var value = ((Math.round(Math.random()*10000000))/100) - 20;
            rowItem[month.toLocaleLowerCase()] = value;
            totalWinnings += value;
        });
        rowItem.totalWinnings = totalWinnings;

        //create dummy data for the additional columns
        for (var col = defaultCols.length; col<colCount; col++) {
            var value;
            var randomBit = Math.random().toString().substring(2,5);
            value = colNames[col % colNames.length]+"-"+randomBit +" - (" +row+","+col+")";
            rowItem["col"+col] = value;
        }
        data.push(rowItem);
    }
    return data;
}

function selectionChanged(event) {
    console.log('Callback selectionChanged: selection count = ' + event.selectedRows.length);
}

function rowSelected(event) {
    // this clogs the console, when to many rows displayed, and use selected 'select all'.
    // so check 'not to many rows'
    if (gridOptions.rowData.length <= 100) {
        var valueToPrint = event.node.group ? 'group ('+event.node.key+')' : event.node.data.name;
        console.log("Callback rowSelected: " + valueToPrint);
    }
}

function rowDeselected(event) {
    // this clogs the console, when to many rows displayed, and use selected 'select all'.
    // so check 'not to many rows'
    if (gridOptions.rowData.length <= 100) {
        var valueToPrint = event.node.group ? 'group ('+event.node.key+')' : event.node.data.name;
        console.log("Callback rowDeselected: " + valueToPrint);
    }
}

function onThemeChanged(newTheme) {
    gridDiv.className = newTheme;
}

function onFilterChanged(newFilter) {
    gridOptions.api.setQuickFilter(newFilter);
}

var COUNTRY_CODES = {
    Ireland: "ie",
    Spain: "es",
    "United Kingdom": "gb",
    France: "fr",
    Germany: "de",
    Sweden: "se",
    Italy: "it",
    Greece: "gr",
    Iceland: "is",
    Portugal: "pt",
    Malta: "mt",
    Norway: "no",
    Brazil: "br",
    Argentina: "ar",
    Colombia: "co",
    Peru: "pe",
    Venezuela: "ve",
    Uruguay: "uy"
};

function numberNewValueHandler(params) {
    var valueAsNumber = parseFloat(params.newValue);
    var field = params.colDef.field;
    var data = params.data;
    data[field] = valueAsNumber;
}

function PersonFilter() {
}

PersonFilter.prototype.init = function (params) {
    this.$scope = params.$scope;
    this.$scope.onFilterChanged = function() {
        params.filterChangedCallback();
    };
    this.valueGetter = params.valueGetter;
};

PersonFilter.prototype.getGui = function () {
    return '<div>' +
     '  <div style="font-weight: bold; background-color: #bbb; text-align: center;">Example Custom Filter</div>' +
     '  <div style="margin: 4px;"><input type="text" ng-model="filterText" ng-change="onFilterChanged()" placeholder="Full name search..."/></div>' +
     '  <div style="display: inline-block; width: 200px; padding: 4px; margin: 4px; border: 1px solid #888; background-color: #fffff0;">' +
     '    This filter does partial word search, the following all bring back the name Sophie Beckham: <br/>' +
     '    => "sophie"<br/>' +
     '    => "beckham"<br/>' +
     '    => "sophie beckham"<br/>' +
     '    => "beckham sophie"<br/>' +
     '    => "beck so"<br/>' +
     '  </div>' +
     '</div>';
};

PersonFilter.prototype.doesFilterPass = function (params) {
    var filterText = this.$scope.filterText;
    if (!filterText) {
        return true;
    }
    // make sure each word passes separately, ie search for firstname, lastname
    var passed = true;
    var value = this.valueGetter(params);
    filterText.toLowerCase().split(" ").forEach(function(filterWord) {
        if (value.toString().toLowerCase().indexOf(filterWord)<0) {
            passed = false;
        }
    });

    return passed;
};

PersonFilter.prototype.isFilterActive = function () {
    var value = this.$scope.filterText;
    return value !== null && value !== undefined && value !== '';
};

function WinningsFilter() {
}

WinningsFilter.prototype.init = function (params) {

    var uniqueId = Math.random();
    this.filterChangedCallback = params.filterChangedCallback;
    this.eGui = document.createElement("div");
    this.eGui.innerHTML =
        '<div style="padding: 4px;">' +
        '<div style="font-weight: bold;">Example Custom Filter</div>' +
        '<div><label><input type="radio" name="filter"'+uniqueId+' id="cbNoFilter">No filter</input></label></div>' +
        '<div><label><input type="radio" name="filter"'+uniqueId+' id="cbPositive">Positive</input></label></div>' +
        '<div><label><input type="radio" name="filter"'+uniqueId+' id="cbNegative">Negative</input></label></div>' +
        '<div><label><input type="radio" name="filter"'+uniqueId+' id="cbGreater50">&gt; &pound;50,000</label></div>' +
        '<div><label><input type="radio" name="filter"'+uniqueId+' id="cbGreater90">&gt; &pound;90,000</label></div>' +
        '</div>';
    this.cbNoFilter = this.eGui.querySelector('#cbNoFilter');
    this.cbPositive = this.eGui.querySelector('#cbPositive');
    this.cbNegative = this.eGui.querySelector('#cbNegative');
    this.cbGreater50 = this.eGui.querySelector('#cbGreater50');
    this.cbGreater90 = this.eGui.querySelector('#cbGreater90');
    this.cbNoFilter.checked = true; // initialise the first to checked
    this.cbNoFilter.onclick = this.filterChangedCallback;
    this.cbPositive.onclick = this.filterChangedCallback;
    this.cbNegative.onclick = this.filterChangedCallback;
    this.cbGreater50.onclick = this.filterChangedCallback;
    this.cbGreater90.onclick = this.filterChangedCallback;
    this.valueGetter = params.valueGetter;
};

WinningsFilter.prototype.getGui = function () {
    return this.eGui;
};

WinningsFilter.prototype.doesFilterPass = function (node) {
    var value = this.valueGetter(node);
    if (this.cbNoFilter.checked) {
        return true;
    } else if (this.cbPositive.checked) {
        return value >= 0;
    } else if (this.cbNegative.checked) {
        return value < 0;
    } else if (this.cbGreater50.checked) {
        return value >= 50000;
    } else if (this.cbGreater90.checked) {
        return value >= 90000;
    } else {
        console.error('invalid checkbox selection');
    }
};

WinningsFilter.prototype.isFilterActive = function () {
    return !this.cbNoFilter.checked;
};

function currencyCssFunc(params) {
    if (params.value!==null && params.value!==undefined && params.value<0) {
        return {"color": "red", "text-align": "right", "font-weight": "bold"};
    } else {
        return {"text-align": "right"};
    }
}

function ratingFilterRenderer(params)  {
    return ratingRendererGeneral(params.value, true)
}

function ratingRenderer(params) {
    return ratingRendererGeneral(params.value, false)
}

function ratingRendererGeneral(value, forFilter)  {
    var result = '<span>';
    for (var i = 0; i<5; i++) {
        if (value>i) {
            result += '<img src="images/goldStar.png"/>';
        }
    }
    if (forFilter && value === 0) {
        result += '(no stars)';
    }
    return result;
}

function currencyRenderer(params)  {
    if (params.value===null || params.value===undefined) {
        return null;
    } else if (isNaN(params.value)) {
        return 'NaN';
    } else {
        return '&pound;' + Math.floor(params.value).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    }
}

function booleanComparator(value1, value2) {
    var value1Cleaned = booleanCleaner(value1);
    var value2Cleaned = booleanCleaner(value2);
    var value1Ordinal = value1Cleaned===true ? 0 : (value1Cleaned===false ? 1 : 2);
    var value2Ordinal = value2Cleaned===true ? 0 : (value2Cleaned===false ? 1 : 2);
    return value1Ordinal - value2Ordinal;
}

function booleanCellRenderer(params) {
    var valueCleaned = booleanCleaner(params.value);
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

function booleanFilterCellRenderer(params) {
    var valueCleaned = booleanCleaner(params.value);
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

function languageCellRenderer(params) {
    if (params.$scope) {
        return "<span ng-click='clicked=true' ng-show='!clicked'>Click Me</span>" +
            "<span ng-click='clicked=false' ng-show='clicked' ng-bind='data.language'></span>";
    } else if (params.value) {
        return params.value;
    } else {
        return null;
    }
}

function countryCellRenderer(params) {
    //get flags from here: http://www.freeflagicons.com/
    if (params.value==="" || params.value===undefined || params.value===null) {
        return null;
    } else {
        var flag = "<img border='0' width='15' height='10' src='https://flags.fmcdn.net/data/flags/mini/"+COUNTRY_CODES[params.value]+".png'>";
        return flag + " " + params.value;
    }
}
