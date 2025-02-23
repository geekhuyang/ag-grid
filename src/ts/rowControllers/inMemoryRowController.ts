/// <reference path="../utils.ts" />
/// <reference path="../constants.ts" />
/// <reference path="../groupCreator.ts" />
/// <reference path="../entities/rowNode.ts" />

module agGrid {

    var _ = Utils;
    var constants = Constants;

    enum RecursionType {Normal, AfterFilter, AfterFilterAndSort};

    export class InMemoryRowController {

        private gridOptionsWrapper: GridOptionsWrapper;
        private columnController: ColumnController;
        private angularGrid: Grid;
        private filterManager: FilterManager;
        private $scope: any;

        // the rows go through a pipeline of steps, each array below is the result
        // after a certain step.
        private allRows: RowNode[]; // the rows, in a list, as provided by the user, but wrapped in RowNode objects
        private rowsAfterGroup: RowNode[]; // rows in group form, stored in a tree (the parent / child bits of RowNode are used)
        private rowsAfterFilter: RowNode[]; // after filtering
        private rowsAfterSort: RowNode[]; // after sorting
        private rowsToDisplay: RowNode[]; // the rows mapped to rows to display
        private model: any;

        private groupCreator: GroupCreator;
        private valueService: ValueService;
        private eventService: EventService;

        constructor() {
            this.createModel();
        }

        init(gridOptionsWrapper: GridOptionsWrapper, columnController: ColumnController, angularGrid: any,
             filterManager: FilterManager, $scope: any, groupCreator: GroupCreator, valueService: ValueService,
             eventService: EventService) {
            this.gridOptionsWrapper = gridOptionsWrapper;
            this.columnController = columnController;
            this.angularGrid = angularGrid;
            this.filterManager = filterManager;
            this.$scope = $scope;
            this.groupCreator = groupCreator;
            this.valueService = valueService;
            this.eventService = eventService;

            this.allRows = null;
            this.rowsAfterGroup = null;
            this.rowsAfterFilter = null;
            this.rowsAfterSort = null;
            this.rowsToDisplay = null;
        }

        private createModel() {
            var that = this;
            this.model = {
                // this method is implemented by the inMemory model only,
                // it gives the top level of the selection. used by the selection
                // controller, when it needs to do a full traversal
                getTopLevelNodes: function () {
                    return that.rowsAfterGroup;
                },
                getVirtualRow: function (index: any): RowNode {
                    return that.rowsToDisplay[index];
                },
                getVirtualRowCount: function (): number {
                    if (that.rowsToDisplay) {
                        return that.rowsToDisplay.length;
                    } else {
                        return 0;
                    }
                },
                getRowAtPixel: function(pixel: number): number {
                    return that.getRowAtPixel(pixel);
                },
                getVirtualRowCombinedHeight: function (): number {
                    return that.getVirtualRowCombinedHeight();
                },
                forEachInMemory: function (callback: any) {
                    that.forEachInMemory(callback);
                },
                forEachNode: function (callback: any) {
                    that.forEachNode(callback);
                },
                forEachNodeAfterFilter: function (callback: any) {
                    that.forEachNodeAfterFilter(callback);
                },
                forEachNodeAfterFilterAndSort: function (callback: any) {
                    that.forEachNodeAfterFilterAndSort(callback);
                }
            };
        }

        public getRowAtPixel(pixelToMatch: number): number {
            // do binary search of tree
            // http://oli.me.uk/2013/06/08/searching-javascript-arrays-with-a-binary-search/
            var bottomPointer = 0;
            var topPointer = this.rowsToDisplay.length - 1;

            // quick check, if the pixel is out of bounds, then return last row
            var lastNode = this.rowsToDisplay[this.rowsToDisplay.length-1];
            if (lastNode.rowTop<=pixelToMatch) {
                return this.rowsToDisplay.length - 1;
            }

            while (true) {

                var midPointer = Math.floor((bottomPointer + topPointer) / 2);
                var currentRowNode = this.rowsToDisplay[midPointer];

                if (this.isRowInPixel(currentRowNode, pixelToMatch)) {
                    return midPointer;
                } else if (currentRowNode.rowTop < pixelToMatch) {
                    bottomPointer = midPointer + 1;
                } else if (currentRowNode.rowTop > pixelToMatch) {
                    topPointer = midPointer - 1;
                }

            }
        }

        private isRowInPixel(rowNode: RowNode, pixelToMatch: number): boolean {
            var topPixel = rowNode.rowTop;
            var bottomPixel = rowNode.rowTop + rowNode.rowHeight;
            var pixelInRow = topPixel <= pixelToMatch && bottomPixel > pixelToMatch;
            return pixelInRow;
        }

        public getVirtualRowCombinedHeight(): number {
            if (this.rowsToDisplay && this.rowsToDisplay.length > 0) {
                var lastRow = this.rowsToDisplay[this.rowsToDisplay.length - 1];
                var lastPixel = lastRow.rowTop + lastRow.rowHeight;
                return lastPixel;
            } else {
                return 0;
            }
        }

        public getModel() {
            return this.model;
        }

        public forEachInMemory(callback: Function) {
            console.warn('ag-Grid: please use forEachNode instead of forEachInMemory, method is same, I just renamed it, forEachInMemory is deprecated');
            this.forEachNode(callback);
        }

        public forEachNode(callback: Function) {
            this.recursivelyWalkNodesAndCallback(this.rowsAfterGroup, callback, RecursionType.Normal, 0);
        }

        public forEachNodeAfterFilter(callback: Function) {
            this.recursivelyWalkNodesAndCallback(this.rowsAfterFilter, callback, RecursionType.AfterFilter, 0);
        }

        public forEachNodeAfterFilterAndSort(callback: Function) {
            this.recursivelyWalkNodesAndCallback(this.rowsAfterSort, callback, RecursionType.AfterFilterAndSort, 0);
        }

        // iterates through each item in memory, and calls the callback function
        // nodes - the rowNodes to traverse
        // callback - the user provided callback
        // recursion type - need this to know what child nodes to recurse, eg if looking at all nodes, or filtered notes etc
        // index - works similar to the index in forEach in javascripts array function
        private recursivelyWalkNodesAndCallback(nodes: RowNode[], callback: Function, recursionType: RecursionType, index: number) {
            if (nodes) {
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];
                    callback(node, index++);
                    // go to the next level if it is a group
                    if (node.group) {
                        // depending on the recursion type, we pick a difference set of children
                        var nodeChildren: RowNode[];
                        switch (recursionType) {
                            case RecursionType.Normal : nodeChildren = node.children; break;
                            case RecursionType.AfterFilter : nodeChildren = node.childrenAfterFilter; break;
                            case RecursionType.AfterFilterAndSort : nodeChildren = node.childrenAfterSort; break;
                        }
                        if (nodeChildren) {
                            index = this.recursivelyWalkNodesAndCallback(nodeChildren, callback, recursionType, index);
                        }
                    }
                }
            }
            return index;
        }

        public updateModel(step: any) {

            // fallthrough in below switch is on purpose
            switch (step) {
                case constants.STEP_EVERYTHING:
                case constants.STEP_FILTER:
                    this.doFilter();
                    this.doAggregate();
                case constants.STEP_SORT:
                    this.doSort();
                case constants.STEP_MAP:
                    this.doRowsToDisplay();
            }

            this.eventService.dispatchEvent(Events.EVENT_MODEL_UPDATED);
            if (this.$scope) {
                setTimeout( () => {
                    this.$scope.$apply();
                }, 0);
            }
        }

        private ensureRowHasHeight(rowNode: RowNode): void {

        }

        private defaultGroupAggFunctionFactory(valueColumns: Column[]) {

            // make closure of variable, so is available for methods below
            var _valueService = this.valueService;

            return function groupAggFunction(rows: any) {

                var result = <any>{};

                for (var j = 0; j < valueColumns.length; j++) {
                    var valueColumn = valueColumns[j];
                    var colKey = valueColumn.getColDef().field;
                    if (!colKey) {
                        console.log('ag-Grid: you need to provide a field for all value columns so that ' +
                            'the grid knows what field to store the result in. so even if using a valueGetter, ' +
                            'the result will not be stored in a value getter.');
                    }
                    // at this point, if no values were numbers, the result is null (not zero)
                    result[colKey] = aggregateColumn(rows, valueColumn.getAggFunc(), colKey, valueColumn.getColDef());
                }

                return result;
            };

            // if colDef is passed in, we are working off a column value, if it is not passed in, we are
            // working off colKeys passed in to the gridOptions
            function aggregateColumn(rowNodes: RowNode[], aggFunc: string, colKey: string, colDef: ColDef) {
                var resultForColumn: any = null;
                for (var i = 0; i < rowNodes.length; i++) {
                    var rowNode = rowNodes[i];
                    // if the row is a group, then it will only have an agg result value,
                    // which means valueGetter is never used.
                    var thisColumnValue: any;
                    if (colDef && !rowNode.group) {
                        thisColumnValue = _valueService.getValue(colDef, rowNode.data, rowNode);
                    } else {
                        thisColumnValue = rowNode.data[colKey];
                    }
                    // only include if the value is a number
                    if (typeof thisColumnValue === 'number') {

                        switch (aggFunc) {
                            case Column.AGG_SUM :
                                resultForColumn += thisColumnValue;
                                break;
                            case Column.AGG_MIN :
                                if (resultForColumn === null) {
                                    resultForColumn = thisColumnValue;
                                } else if (resultForColumn > thisColumnValue) {
                                    resultForColumn = thisColumnValue;
                                }
                                break;
                            case Column.AGG_MAX :
                                if (resultForColumn === null) {
                                    resultForColumn = thisColumnValue;
                                } else if (resultForColumn < thisColumnValue) {
                                    resultForColumn = thisColumnValue;
                                }
                                break;
                        }

                    }
                }
                return resultForColumn;
            }
        }

        // it's possible to recompute the aggregate without doing the other parts
        public doAggregate() {

            var groupAggFunction = this.gridOptionsWrapper.getGroupAggFunction();
            if (typeof groupAggFunction === 'function') {
                this.recursivelyCreateAggData(this.rowsAfterFilter, groupAggFunction, 0);
                return;
            }

            var valueColumns = this.columnController.getValueColumns();
            if (valueColumns && valueColumns.length > 0) {
                var defaultAggFunction = this.defaultGroupAggFunctionFactory(valueColumns);
                this.recursivelyCreateAggData(this.rowsAfterFilter, defaultAggFunction, 0);
            } else {
                // if no agg data, need to clear out any previous items, when can be left behind
                // if use is creating / removing columns using the tool panel.
                // one exception - don't do this if already grouped, as this breaks the File Explorer example!!
                // to fix another day - how to we reset when the user provided the data??
                if (!this.gridOptionsWrapper.isRowsAlreadyGrouped()) {
                    this.recursivelyClearAggData(this.rowsAfterFilter);
                }
            }
        }

        public expandOrCollapseAll(expand: boolean, rowNodes: RowNode[]) {
            // if first call in recursion, we set list to parent list
            if (rowNodes === null) {
                rowNodes = this.rowsAfterGroup;
            }

            if (!rowNodes) {
                return;
            }

            rowNodes.forEach( (node: RowNode) => {
                if (node.group) {
                    node.expanded = expand;
                    this.expandOrCollapseAll(expand, node.children);
                }
            });
        }

        private recursivelyClearAggData(nodes: RowNode[]) {
            for (var i = 0, l = nodes.length; i < l; i++) {
                var node = nodes[i];
                if (node.group) {
                    // agg function needs to start at the bottom, so traverse first
                    this.recursivelyClearAggData(node.childrenAfterFilter);
                    node.data = null;
                }
            }
        }

        private recursivelyCreateAggData(nodes: RowNode[], groupAggFunction: any, level: number) {
            for (var i = 0, l = nodes.length; i < l; i++) {
                var node = nodes[i];
                if (node.group) {
                    // agg function needs to start at the bottom, so traverse first
                    this.recursivelyCreateAggData(node.childrenAfterFilter, groupAggFunction, level++);
                    // after traversal, we can now do the agg at this level
                    var data = groupAggFunction(node.childrenAfterFilter, level);
                    node.data = data;
                    // if we are grouping, then it's possible there is a sibling footer
                    // to the group, so update the data here also if there is one
                    if (node.sibling) {
                        node.sibling.data = data;
                    }
                }
            }
        }

        private doSort() {
            var sorting: any;

            // if the sorting is already done by the server, then we should not do it here
            if (this.gridOptionsWrapper.isEnableServerSideSorting()) {
                sorting = false;
            } else {
                //see if there is a col we are sorting by
                var sortingOptions = <any>[];
                this.columnController.getAllColumns().forEach(function (column: Column) {
                    if (column.getSort()) {
                        var ascending = column.getSort() === Column.SORT_ASC;
                        sortingOptions.push({
                            inverter: ascending ? 1 : -1,
                            sortedAt: column.getSortedAt(),
                            column: column
                        });
                    }
                });
                if (sortingOptions.length > 0) {
                    sorting = true;
                }
            }

            var rowNodesReadyForSorting = this.rowsAfterFilter ? this.rowsAfterFilter.slice(0) : null;

            if (sorting) {
                // The columns are to be sorted in the order that the user selected them:
                sortingOptions.sort(function (optionA: any, optionB: any) {
                    return optionA.sortedAt - optionB.sortedAt;
                });
                this.sortList(rowNodesReadyForSorting, sortingOptions);
            } else {
                // if no sorting, set all group children after sort to the original list.
                // note: it is important to do this, even if doing server side sorting,
                // to allow the rows to pass to the next stage (ie set the node value
                // childrenAfterSort)
                this.recursivelyResetSort(rowNodesReadyForSorting);
            }

            this.rowsAfterSort = rowNodesReadyForSorting;
        }

        private recursivelyResetSort(rowNodes: RowNode[]) {
            if (!rowNodes) {
                return;
            }
            for (var i = 0, l = rowNodes.length; i < l; i++) {
                var item = rowNodes[i];
                if (item.group && item.children) {
                    item.childrenAfterSort = item.childrenAfterFilter;
                    this.recursivelyResetSort(item.children);
                }
            }

            this.updateChildIndexes(rowNodes);
        }

        private sortList(nodes: RowNode[], sortOptions: any) {

            // sort any groups recursively
            for (var i = 0, l = nodes.length; i < l; i++) { // critical section, no functional programming
                var node = nodes[i];
                if (node.group && node.children) {
                    node.childrenAfterSort = node.childrenAfterFilter.slice(0);
                    this.sortList(node.childrenAfterSort, sortOptions);
                }
            }

            var that = this;

            function compare(nodeA: RowNode, nodeB: RowNode, column:Column, isInverted: boolean) {
                var valueA = that.valueService.getValue(column.getColDef(), nodeA.data, nodeA);
                var valueB = that.valueService.getValue(column.getColDef(), nodeB.data, nodeB);
                if (column.getColDef().comparator) {
                    //if comparator provided, use it
                    return column.getColDef().comparator(valueA, valueB, nodeA, nodeB, isInverted);
                } else {
                    //otherwise do our own comparison
                    return _.defaultComparator(valueA, valueB);
                }
            }

            nodes.sort(function (nodeA: RowNode, nodeB: RowNode) {
                // Iterate columns, return the first that doesn't match
                for (var i = 0, len = sortOptions.length; i < len; i++) {
                    var sortOption = sortOptions[i];
                    var compared = compare(nodeA, nodeB, sortOption.column, sortOption.inverter === -1);
                    if (compared !== 0) {
                        return compared * sortOption.inverter;
                    }
                }
                // All matched, these are identical as far as the sort is concerned:
                return 0;
            });

            this.updateChildIndexes(nodes);
        }

        private updateChildIndexes(nodes: RowNode[]) {
            for (var j = 0; j<nodes.length; j++) {
                var node = nodes[j];
                node.firstChild = j === 0;
                node.lastChild = j === nodes.length - 1;
                node.childIndex = j;
            }
        }

        // called by grid when row group cols change
        public onRowGroupChanged(): void {
            this.doRowGrouping();
            this.updateModel(constants.STEP_EVERYTHING);
        }

        private doRowGrouping() {
            var rowsAfterGroup: any;
            var groupedCols = this.columnController.getRowGroupColumns();
            var rowsAlreadyGrouped = this.gridOptionsWrapper.isRowsAlreadyGrouped();

            var doingGrouping = !rowsAlreadyGrouped && groupedCols.length > 0;

            if (doingGrouping) {
                var expandByDefault: number;
                if (this.gridOptionsWrapper.isGroupSuppressRow()) {
                    // 99999 means 'expand everything'
                    expandByDefault = -1;
                } else {
                    expandByDefault = this.gridOptionsWrapper.getGroupDefaultExpanded();
                }
                rowsAfterGroup = this.groupCreator.group(this.allRows, groupedCols, expandByDefault);
            } else {
                rowsAfterGroup = this.allRows;
            }
            this.rowsAfterGroup = rowsAfterGroup;
        }

        private doFilter() {
            var doingFilter: boolean;

            if (this.gridOptionsWrapper.isEnableServerSideFilter()) {
                doingFilter = false;
            } else {
                doingFilter = this.filterManager.isAnyFilterPresent();
            }

            var rowsAfterFilter: RowNode[];
            if (doingFilter) {
                rowsAfterFilter = this.filterItems(this.rowsAfterGroup);
            } else {
                // do it here
                rowsAfterFilter = this.rowsAfterGroup;
                this.recursivelyResetFilter(this.rowsAfterGroup);
            }

            this.rowsAfterFilter = rowsAfterFilter;
        }

        private filterItems(rowNodes: RowNode[]) {
            var result: RowNode[] = [];

            for (var i = 0, l = rowNodes.length; i < l; i++) {
                var node = rowNodes[i];

                if (node.group) {
                    // deal with group
                    node.childrenAfterFilter = this.filterItems(node.children);
                    if (node.childrenAfterFilter.length > 0) {
                        node.allChildrenCount = this.getTotalChildCount(node.childrenAfterFilter);
                        result.push(node);
                    }
                } else {
                    if (this.filterManager.doesRowPassFilter(node)) {
                        result.push(node);
                    }
                }
            }

            return result;
        }

        private recursivelyResetFilter(nodes: RowNode[]) {
            if (!nodes) {
                return;
            }
            for (var i = 0, l = nodes.length; i < l; i++) {
                var node = nodes[i];
                if (node.group && node.children) {
                    node.childrenAfterFilter = node.children;
                    this.recursivelyResetFilter(node.children);
                    node.allChildrenCount = this.getTotalChildCount(node.childrenAfterFilter);
                }
            }
        }

        // rows: the rows to put into the model
        // firstId: the first id to use, used for paging, where we are not on the first page
        public setAllRows(rows: RowNode[], firstId?: number) {
            var nodes: RowNode[];
            if (this.gridOptionsWrapper.isRowsAlreadyGrouped()) {
                nodes = rows;
                this.recursivelyCheckUserProvidedNodes(nodes, null, 0);
            } else {
                // place each row into a wrapper
                var nodes: RowNode[] = [];
                if (rows) {
                    for (var i = 0; i < rows.length; i++) { // could be lots of rows, don't use functional programming
                        var node = <RowNode>{};
                        node.data = rows[i];
                        nodes.push(node);
                    }
                }
            }

            // if firstId provided, use it, otherwise start at 0
            var firstIdToUse = firstId ? firstId : 0;
            this.recursivelyAddIdToNodes(nodes, firstIdToUse);
            this.allRows = nodes;

            // group here, so filters have the agg data ready
            if (this.columnController.isSetupComplete()) {
                this.doRowGrouping();
            }
        }

        // add in index - this is used by the selectionController - so quick
        // to look up selected rows
        private recursivelyAddIdToNodes(nodes: RowNode[], index: number) {
            if (!nodes) {
                return;
            }
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                node.id = index++;
                if (node.group && node.children) {
                    index = this.recursivelyAddIdToNodes(node.children, index);
                }
            }
            return index;
        }

        // add in index - this is used by the selectionController - so quick
        // to look up selected rows
        private recursivelyCheckUserProvidedNodes(nodes: RowNode[], parent: RowNode, level: number) {
            if (!nodes) {
                return;
            }
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (parent && !this.gridOptionsWrapper.isSuppressParentsInRowNodes()) {
                    node.parent = parent;
                }
                node.level = level;
                if (node.group && node.children) {
                    this.recursivelyCheckUserProvidedNodes(node.children, node, level + 1);
                }
            }
        }

        private getTotalChildCount(rowNodes: any) {
            var count = 0;
            for (var i = 0, l = rowNodes.length; i < l; i++) {
                var item = rowNodes[i];
                if (item.group) {
                    count += item.allChildrenCount;
                } else {
                    count++;
                }
            }
            return count;
        }

        private nextRowTop: number;

        private doRowsToDisplay() {
            // even if not doing grouping, we do the mapping, as the client might
            // of passed in data that already has a grouping in it somewhere
            this.rowsToDisplay = [];
            this.nextRowTop = 0;
            this.recursivelyAddToRowsToDisplay(this.rowsAfterSort);
        }

        private recursivelyAddToRowsToDisplay(rowNodes: RowNode[]) {
            if (!rowNodes) {
                return;
            }
            var groupSuppressRow = this.gridOptionsWrapper.isGroupSuppressRow();
            for (var i = 0; i < rowNodes.length; i++) {
                var rowNode = rowNodes[i];
                var skipGroupNode = groupSuppressRow && rowNode.group;
                if (!skipGroupNode) {
                    this.addRowNodeToRowsToDisplay(rowNode);
                }
                if (rowNode.group && rowNode.expanded) {
                    this.recursivelyAddToRowsToDisplay(rowNode.childrenAfterSort);

                    // put a footer in if user is looking for it
                    if (this.gridOptionsWrapper.isGroupIncludeFooter()) {
                        var footerNode = this.createFooterNode(rowNode);
                        this.addRowNodeToRowsToDisplay(footerNode);
                    }
                }
            }
        }

        // duplicated method, it's also in floatingRowModel
        private addRowNodeToRowsToDisplay(rowNode: RowNode): void {
            this.rowsToDisplay.push(rowNode);
            rowNode.rowHeight = this.gridOptionsWrapper.getRowHeightForNode(rowNode);
            rowNode.rowTop = this.nextRowTop;
            this.nextRowTop += rowNode.rowHeight;
        }

        private createFooterNode(groupNode: any) {
            var footerNode = <any>{};
            Object.keys(groupNode).forEach(function (key) {
                footerNode[key] = groupNode[key];
            });
            footerNode.footer = true;
            // get both header and footer to reference each other as siblings. this is never undone,
            // only overwritten. so if a group is expanded, then contracted, it will have a ghost
            // sibling - but that's fine, as we can ignore this if the header is contracted.
            footerNode.sibling = groupNode;
            groupNode.sibling = footerNode;
            return footerNode;
        }

    }
}

