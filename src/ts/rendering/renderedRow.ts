/// <reference path="../gridOptionsWrapper.ts" />
/// <reference path="../grid.ts" />
/// <reference path="../utils.ts" />
/// <reference path="../columnController/columnController.ts" />
/// <reference path="../expressionService.ts" />
/// <reference path="rowRenderer.ts" />
/// <reference path="../templateService.ts" />
/// <reference path="../selectionController.ts" />
/// <reference path="renderedCell.ts" />
/// <reference path="../virtualDom/vHtmlElement.ts" />

module agGrid {

    var _ = Utils;

    export class RenderedRow {

        public vPinnedLeftRow: any;
        public vPinnedRightRow: any;
        public vBodyRow: any;

        private renderedCells: {[key: number]: RenderedCell} = {};
        private scope: any;
        private node: RowNode;
        private rowIndex: number;

        private cellRendererMap: {[key: string]: any};

        private gridOptionsWrapper: GridOptionsWrapper;
        private parentScope: any;
        private angularGrid: Grid;
        private columnController: ColumnController;
        private expressionService: ExpressionService;
        private rowRenderer: RowRenderer;
        private selectionRendererFactory: SelectionRendererFactory;
        private $compile: any;
        private templateService: TemplateService;
        private selectionController: SelectionController;
        private pinningLeft: boolean;
        private pinningRight: boolean;
        private eBodyContainer: HTMLElement;
        private ePinnedLeftContainer: HTMLElement;
        private ePinnedRightContainer: HTMLElement;
        private valueService: ValueService;
        private eventService: EventService;

        constructor(gridOptionsWrapper: GridOptionsWrapper,
                    valueService: ValueService,
                    parentScope: any,
                    angularGrid: Grid,
                    columnController: ColumnController,
                    expressionService: ExpressionService,
                    cellRendererMap: {[key: string]: any},
                    selectionRendererFactory: SelectionRendererFactory,
                    $compile: any,
                    templateService: TemplateService,
                    selectionController: SelectionController,
                    rowRenderer: RowRenderer,
                    eBodyContainer: HTMLElement,
                    ePinnedLeftContainer: HTMLElement,
                    ePinnedRightContainer: HTMLElement,
                    node: RowNode,
                    rowIndex: number,
                    eventService: EventService) {
            this.gridOptionsWrapper = gridOptionsWrapper;
            this.valueService = valueService;
            this.parentScope = parentScope;
            this.angularGrid = angularGrid;
            this.expressionService = expressionService;
            this.columnController = columnController;
            this.cellRendererMap = cellRendererMap;
            this.selectionRendererFactory = selectionRendererFactory;
            this.$compile = $compile;
            this.templateService = templateService;
            this.selectionController = selectionController;
            this.rowRenderer = rowRenderer;
            this.eBodyContainer = eBodyContainer;
            this.ePinnedLeftContainer = ePinnedLeftContainer;
            this.ePinnedRightContainer = ePinnedRightContainer;

            this.pinningLeft = columnController.isPinningLeft();
            this.pinningRight = columnController.isPinningRight();

            this.eventService = eventService;

            var groupHeaderTakesEntireRow = this.gridOptionsWrapper.isGroupUseEntireRow();
            var rowIsHeaderThatSpans = node.group && groupHeaderTakesEntireRow;

            this.vBodyRow = this.createRowContainer();
            if (this.pinningLeft) {
                this.vPinnedLeftRow = this.createRowContainer();
            }
            if (this.pinningRight) {
                this.vPinnedRightRow = this.createRowContainer();
            }

            this.rowIndex = rowIndex;
            this.node = node;
            this.scope = this.createChildScopeOrNull(node.data);

            if (!rowIsHeaderThatSpans) {
                this.drawNormalRow();
            }

            this.addDynamicStyles();
            this.addDynamicClasses();

            var rowStr = this.rowIndex.toString();
            if (this.node.floatingBottom) {
                rowStr = 'fb-' + rowStr;
            } else if (this.node.floatingTop) {
                rowStr = 'ft-' + rowStr;
            }

            this.vBodyRow.setAttribute('row', rowStr);
            if (this.pinningLeft) {
                this.vPinnedLeftRow.setAttribute('row', rowStr);
            }
            if (this.pinningRight) {
                this.vPinnedRightRow.setAttribute('row', rowStr);
            }

            if (typeof this.gridOptionsWrapper.getBusinessKeyForNodeFunc() === 'function') {
                var businessKey = this.gridOptionsWrapper.getBusinessKeyForNodeFunc()(this.node);
                if (typeof businessKey === 'string' || typeof businessKey === 'number') {
                    this.vBodyRow.setAttribute('row-id', businessKey);
                    if (this.pinningLeft) {
                        this.vPinnedLeftRow.setAttribute('row-id', businessKey);
                    }
                    if (this.pinningRight) {
                        this.vPinnedRightRow.setAttribute('row-id', businessKey);
                    }
                }
            }

            // if showing scrolls, position on the container
            if (!this.gridOptionsWrapper.isForPrint()) {
                var topPx = this.node.rowTop + "px";
                this.vBodyRow.style.top = topPx;
                if (this.pinningLeft) {
                    this.vPinnedLeftRow.style.top = topPx;
                }
                if (this.pinningRight) {
                    this.vPinnedRightRow.style.top = topPx;
                }
            }
            var heightPx = this.node.rowHeight + 'px';
            this.vBodyRow.style.height = heightPx;
            if (this.pinningLeft) {
                this.vPinnedLeftRow.style.height = heightPx;
            }
            if (this.pinningRight) {
                this.vPinnedRightRow.style.height = heightPx;
            }

            // if group item, insert the first row
            if (rowIsHeaderThatSpans) {
                this.createGroupRow();
            }

            this.bindVirtualElement(this.vBodyRow);
            if (this.pinningLeft) {
                this.bindVirtualElement(this.vPinnedLeftRow);
            }
            if (this.pinningRight) {
                this.bindVirtualElement(this.vPinnedRightRow);
            }

            if (this.scope) {
                this.$compile(this.vBodyRow.getElement())(this.scope);
                if (this.pinningLeft) {
                    this.$compile(this.vPinnedLeftRow.getElement())(this.scope);
                }
                if (this.pinningRight) {
                    this.$compile(this.vPinnedRightRow.getElement())(this.scope);
                }
            }

            this.eBodyContainer.appendChild(this.vBodyRow.getElement());
            if (this.pinningLeft) {
                this.ePinnedLeftContainer.appendChild(this.vPinnedLeftRow.getElement());
            }
            if (this.pinningRight) {
                this.ePinnedRightContainer.appendChild(this.vPinnedRightRow.getElement());
            }
        }

        public onRowSelected(selected: boolean): void {
            _.iterateObject(this.renderedCells, (key: any, renderedCell: RenderedCell)=> {
                renderedCell.setSelected(selected);
            });
        }

        public softRefresh(): void {
            _.iterateObject(this.renderedCells, (key: any, renderedCell: RenderedCell)=> {
                if (renderedCell.isVolatile()) {
                    renderedCell.refreshCell();
                }
            });
        }

        public getRenderedCellForColumn(column: Column): RenderedCell {
            return this.renderedCells[column.getIndex()];
        }

        public getCellForCol(column: Column): HTMLElement {
            var renderedCell = this.renderedCells[column.getIndex()];
            if (renderedCell) {
                return renderedCell.getVGridCell().getElement();
            } else {
                return null;
            }
        }

        public destroy(): void {
            this.destroyScope();

            if (this.pinningLeft) {
                this.ePinnedLeftContainer.removeChild(this.vPinnedLeftRow.getElement());
            }
            if (this.pinningRight) {
                this.ePinnedRightContainer.removeChild(this.vPinnedRightRow.getElement());
            }
            this.eBodyContainer.removeChild(this.vBodyRow.getElement());
        }

        private destroyScope(): void {
            if (this.scope) {
                this.scope.$destroy();
                this.scope = null;
            }
        }

        public isDataInList(rows: any[]): boolean {
            return rows.indexOf(this.node.data) >= 0;
        }

        public isNodeInList(nodes: RowNode[]): boolean {
            return nodes.indexOf(this.node) >= 0;
        }

        public isGroup(): boolean {
            return this.node.group === true;
        }

        private drawNormalRow() {
            var columns = this.columnController.getAllDisplayedColumns();
            var firstRightPinnedColIndex = this.columnController.getFirstRightPinnedColIndex();
            for (var colIndex = 0; colIndex<columns.length; colIndex++) {
                var column = columns[colIndex];
                var firstRightPinnedCol = colIndex === firstRightPinnedColIndex;

                var renderedCell = new RenderedCell(firstRightPinnedCol, column,
                    this.$compile, this.rowRenderer, this.gridOptionsWrapper, this.expressionService,
                    this.selectionRendererFactory, this.selectionController, this.templateService,
                    this.cellRendererMap, this.node, this.rowIndex, colIndex, this.scope, this.columnController,
                    this.valueService, this.eventService);

                var vGridCell = renderedCell.getVGridCell();

                if (column.getPinned() === Column.PINNED_LEFT) {
                    this.vPinnedLeftRow.appendChild(vGridCell);
                } else if (column.getPinned()=== Column.PINNED_RIGHT) {
                    this.vPinnedRightRow.appendChild(vGridCell);
                } else {
                    this.vBodyRow.appendChild(vGridCell);
                }

                this.renderedCells[column.getIndex()] = renderedCell;
            }
        }

        private bindVirtualElement(vElement: VHtmlElement): void {
            var html = vElement.toHtmlString();
            var element: Element = <Element> _.loadTemplate(html);
            vElement.elementAttached(element);
        }

        private createGroupRow() {
            var eGroupRow = this.createGroupSpanningEntireRowCell(false);

            if (this.pinningLeft) {
                this.vPinnedLeftRow.appendChild(eGroupRow);
                var eGroupRowPadding = this.createGroupSpanningEntireRowCell(true);
                this.vBodyRow.appendChild(eGroupRowPadding);
            } else {
                this.vBodyRow.appendChild(eGroupRow);
            }

            if (this.pinningRight) {
                var ePinnedRightPadding = this.createGroupSpanningEntireRowCell(true);
                this.vPinnedRightRow.appendChild(ePinnedRightPadding);
            }
        }

        private createGroupSpanningEntireRowCell(padding: any) {
            var eRow: any;
            // padding means we are on the right hand side of a pinned table, ie
            // in the main body.
            if (padding) {
                eRow = document.createElement('span');
            } else {
                var rowCellRenderer = this.gridOptionsWrapper.getGroupRowRenderer();
                if (!rowCellRenderer) {
                    rowCellRenderer = {
                        renderer: 'group',
                        innerRenderer: this.gridOptionsWrapper.getGroupRowInnerRenderer()
                    };
                }
                var params = {
                    node: this.node,
                    data: this.node.data,
                    rowIndex: this.rowIndex,
                    api: this.gridOptionsWrapper.getApi(),
                    colDef: {
                        cellRenderer: rowCellRenderer
                    }
                };

                // start duplicated code
                var actualCellRenderer: Function;
                if (typeof rowCellRenderer === 'object' && rowCellRenderer !== null) {
                    var cellRendererObj = <{ renderer: string }> rowCellRenderer;
                    actualCellRenderer = this.cellRendererMap[cellRendererObj.renderer];
                    if (!actualCellRenderer) {
                        throw 'Cell renderer ' + rowCellRenderer + ' not found, available are ' + Object.keys(this.cellRendererMap);
                    }
                } else if (typeof rowCellRenderer === 'function') {
                    actualCellRenderer = <Function>rowCellRenderer;
                } else {
                    throw 'Cell Renderer must be String or Function';
                }
                var resultFromRenderer = actualCellRenderer(params);
                // end duplicated code

                if (_.isNodeOrElement(resultFromRenderer)) {
                    // a dom node or element was returned, so add child
                    eRow = resultFromRenderer;
                } else {
                    // otherwise assume it was html, so just insert
                    eRow = _.loadTemplate(resultFromRenderer);
                }
            }
            if (this.node.footer) {
                _.addCssClass(eRow, 'ag-footer-cell-entire-row');
            } else {
                _.addCssClass(eRow, 'ag-group-cell-entire-row');
            }

            return eRow;
        }

        public setMainRowWidth(width: number) {
            this.vBodyRow.addStyles({width: width + "px"});
        }

        private createChildScopeOrNull(data: any) {
            if (this.gridOptionsWrapper.isAngularCompileRows()) {
                var newChildScope = this.parentScope.$new();
                newChildScope.data = data;
                return newChildScope;
            } else {
                return null;
            }
        }

        private addDynamicStyles() {
            var rowStyle = this.gridOptionsWrapper.getRowStyle();
            if (rowStyle) {
                if (typeof rowStyle === 'function') {
                    console.log('ag-Grid: rowStyle should be a string or an array, not be a function, use getRowStyle() instead');
                } else {
                    this.vBodyRow.addStyles(rowStyle);
                    if (this.pinningLeft) {
                        this.vPinnedLeftRow.addStyles(rowStyle);
                    }
                    if (this.pinningRight) {
                        this.vPinnedRightRow.addStyles(rowStyle);
                    }
                }
            }
            var rowStyleFunc = this.gridOptionsWrapper.getRowStyleFunc();
            if (rowStyleFunc) {
                var params = {
                    data: this.node.data,
                    node: this.node,
                    api: this.gridOptionsWrapper.getApi(),
                    context: this.gridOptionsWrapper.getContext(),
                    $scope: this.scope
                };
                var cssToUseFromFunc = rowStyleFunc(params);
                this.vBodyRow.addStyles(cssToUseFromFunc);
                if (this.pinningLeft) {
                    this.vPinnedLeftRow.addStyles(cssToUseFromFunc);
                }
                if (this.pinningRight) {
                    this.vPinnedRightRow.addStyles(cssToUseFromFunc);
                }
            }
        }

        private createParams(): any {
            var params = {
                node: this.node,
                data: this.node.data,
                rowIndex: this.rowIndex,
                $scope: this.scope,
                context: this.gridOptionsWrapper.getContext(),
                api: this.gridOptionsWrapper.getApi()
            };
            return params;
        }

        private createEvent(event: any, eventSource: any): any {
            var agEvent = this.createParams();
            agEvent.event = event;
            agEvent.eventSource = eventSource;
            return agEvent;
        }

        private createRowContainer() {
            var vRow = new VHtmlElement('div');
            var that = this;
            vRow.addEventListener("click", function (event: any) {
                var agEvent = that.createEvent(event, this);
                that.eventService.dispatchEvent(Events.EVENT_ROW_CLICKED, agEvent);

                // ctrlKey for windows, metaKey for Apple
                var multiSelectKeyPressed = event.ctrlKey || event.metaKey;
                that.angularGrid.onRowClicked(multiSelectKeyPressed, that.rowIndex, that.node);
            });
            vRow.addEventListener("dblclick", function (event: any) {
                var agEvent = that.createEvent(event, this);
                that.eventService.dispatchEvent(Events.EVENT_ROW_DOUBLE_CLICKED, agEvent);
            });

            return vRow;
        }

        public getRowNode(): any {
            return this.node;
        }

        public getRowIndex(): any {
            return this.rowIndex;
        }

        public refreshCells(colIds: string[]): void {
            if (!colIds) {
                return;
            }
            var columnsToRefresh = this.columnController.getColumns(colIds);

            _.iterateObject(this.renderedCells, (key: any, renderedCell: RenderedCell)=> {
                var colForCel = renderedCell.getColumn();
                if (columnsToRefresh.indexOf(colForCel)>=0) {
                    renderedCell.refreshCell();
                }
            });
        }

        private addDynamicClasses() {
            var classes: string[] = [];

            classes.push('ag-row');
            classes.push('ag-row-no-focus');

            classes.push(this.rowIndex % 2 == 0 ? "ag-row-even" : "ag-row-odd");

            if (this.selectionController.isNodeSelected(this.node)) {
                classes.push("ag-row-selected");
            }

            if (this.node.group) {
                classes.push("ag-row-group");
                // if a group, put the level of the group in
                classes.push("ag-row-level-" + this.node.level);

                if (!this.node.footer && this.node.expanded) {
                    classes.push("ag-row-group-expanded");
                }
                if (!this.node.footer && !this.node.expanded) {
                    // opposite of expanded is contracted according to the internet.
                    classes.push("ag-row-group-contracted");
                }
                if (this.node.footer) {
                    classes.push("ag-row-footer");
                }
            } else {
                // if a leaf, and a parent exists, put a level of the parent, else put level of 0 for top level item
                if (this.node.parent) {
                    classes.push("ag-row-level-" + (this.node.parent.level + 1));
                } else {
                    classes.push("ag-row-level-0");
                }
            }

            // add in extra classes provided by the config
            var gridOptionsRowClass = this.gridOptionsWrapper.getRowClass();
            if (gridOptionsRowClass) {
                if (typeof gridOptionsRowClass === 'function') {
                    console.warn('ag-Grid: rowClass should not be a function, please use getRowClass instead');
                } else {
                    if (typeof gridOptionsRowClass === 'string') {
                        classes.push(gridOptionsRowClass);
                    } else if (Array.isArray(gridOptionsRowClass)) {
                        gridOptionsRowClass.forEach(function (classItem: any) {
                            classes.push(classItem);
                        });
                    }
                }
            }

            var gridOptionsRowClassFunc = this.gridOptionsWrapper.getRowClassFunc();
            if (gridOptionsRowClassFunc) {
                var params = {
                    node: this.node,
                    data: this.node.data,
                    rowIndex: this.rowIndex,
                    context: this.gridOptionsWrapper.getContext(),
                    api: this.gridOptionsWrapper.getApi()
                };
                var classToUseFromFunc = gridOptionsRowClassFunc(params);
                if (classToUseFromFunc) {
                    if (typeof classToUseFromFunc === 'string') {
                        classes.push(classToUseFromFunc);
                    } else if (Array.isArray(classToUseFromFunc)) {
                        classToUseFromFunc.forEach(function (classItem: any) {
                            classes.push(classItem);
                        });
                    }
                }
            }

            this.vBodyRow.addClasses(classes);
            if (this.pinningLeft) {
                this.vPinnedLeftRow.addClasses(classes);
            }
            if (this.pinningRight) {
                this.vPinnedRightRow.addClasses(classes);
            }
        }
    }

}
