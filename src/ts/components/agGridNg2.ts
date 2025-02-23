/// <reference path='componentUtil.ts'/>

module agGrid {

    // lets load angular 2 if we can find it
    var _ng: any;

    // we are not using annotations on purpose, as if we do, then there is a runtime dependency
    // on the annotation, which would break this code if angular 2 was not included, which is bad,
    // as angular 2 is optional for ag-grid
    export class AgGridNg2 {

        // not intended for user to interact with. so putting _ in so if use gets reference
        // to this object, they kind'a know it's not part of the agreed interface
        private _agGrid: agGrid.Grid;
        private _initialised = false;

        private gridOptions: GridOptions;

        private api: GridApi;
        private columnApi: ColumnApi;

        // core grid events
        public modelUpdated = new _ng.core.EventEmitter();
        public cellClicked = new _ng.core.EventEmitter();
        public cellDoubleClicked = new _ng.core.EventEmitter();
        public cellContextMenu = new _ng.core.EventEmitter();
        public cellValueChanged = new _ng.core.EventEmitter();
        public cellFocused = new _ng.core.EventEmitter();
        public rowSelected = new _ng.core.EventEmitter();
        public rowDeselected = new _ng.core.EventEmitter();
        public selectionChanged = new _ng.core.EventEmitter();
        public beforeFilterChanged = new _ng.core.EventEmitter();
        public afterFilterChanged = new _ng.core.EventEmitter();
        public filterModified = new _ng.core.EventEmitter();
        public beforeSortChanged = new _ng.core.EventEmitter();
        public afterSortChanged = new _ng.core.EventEmitter();
        public virtualRowRemoved = new _ng.core.EventEmitter();
        public rowClicked = new _ng.core.EventEmitter();
        public rowDoubleClicked = new _ng.core.EventEmitter();
        public ready = new _ng.core.EventEmitter();
        public gridSizeChanged = new _ng.core.EventEmitter();
        public rowGroupOpened = new _ng.core.EventEmitter();

        // column grid events
        public columnEverythingChanged = new _ng.core.EventEmitter();
        public columnRowGroupChanged = new _ng.core.EventEmitter();
        public columnValueChanged = new _ng.core.EventEmitter();
        public columnMoved = new _ng.core.EventEmitter();
        public columnVisible = new _ng.core.EventEmitter();
        public columnGroupOpened = new _ng.core.EventEmitter();
        public columnResized = new _ng.core.EventEmitter();
        public columnPinnedCountChanged = new _ng.core.EventEmitter();

        // properties
        public virtualPaging: boolean;
        public toolPanelSuppressGroups: boolean;
        public toolPanelSuppressValues: boolean;
        public rowsAlreadyGrouped: boolean;
        public suppressRowClickSelection: boolean;
        public suppressCellSelection: boolean;
        public sortingOrder: string[];
        public suppressMultiSort: boolean;
        public suppressHorizontalScroll: boolean;
        public unSortIcon: boolean;
        public rowHeight: number;
        public rowBuffer: number;
        public enableColResize: boolean;
        public enableCellExpressions: boolean;
        public enableSorting: boolean;
        public enableServerSideSorting: boolean;
        public enableFilter: boolean;
        public enableServerSideFilter: boolean;
        public colWidth: number;
        public suppressMenuHide: boolean;
        public debug: boolean;
        public icons: any; // should be typed
        public angularCompileRows: boolean;
        public angularCompileFilters: boolean;
        public angularCompileHeaders: boolean;
        public localeText: any;
        public localeTextFunc: Function;

        public groupSuppressAutoColumn: boolean;
        public groupSelectsChildren: boolean;
        public groupHideGroupColumns: boolean;
        public groupIncludeFooter: boolean;
        public groupUseEntireRow: boolean;
        public groupSuppressRow: boolean;
        public groupSuppressBlankHeader: boolean;
        public groupColumnDef: any; // change to typed
        public forPrint: boolean;

        // changeable, but no immediate impact
        public context: any;
        public rowStyle: any;
        public rowClass: any;
        public headerCellRenderer: any;
        public groupDefaultExpanded: number;
        public slaveGrids: GridOptions[];
        public rowSelection: string;
        public rowDeselection: boolean;
        public headerCellTemplate: string;

        // changeable with impact
        public rowData: any[]; // should this be immutable for ag2?
        public floatingTopRowData: any[]; // should this be immutable ag2?
        public floatingBottomRowData: any[]; // should this be immutable ag2?
        public showToolPanel: boolean;
        public groupAggFunction: (nodes: any[]) => void;
        public columnDefs: any[]; // change to typed
        public datasource: any; // should be typed
        public pinnedColumnCount: number;
        public quickFilterText: string;
        // in properties
        public headerHeight: number;

        constructor(private elementDef: any) {
        }

        // this gets called after the directive is initialised
        public ngOnInit(): void {
            this.gridOptions = ComponentUtil.copyAttributesToGridOptions(this.gridOptions, this);
            var nativeElement = this.elementDef.nativeElement;
            var globalEventLister = this.globalEventListener.bind(this);
            this._agGrid = new agGrid.Grid(nativeElement, this.gridOptions, globalEventLister);
            this.api = this.gridOptions.api;
            this.columnApi = this.gridOptions.columnApi;

            this._initialised = true;
        }

        public ngOnChanges(changes: any): void {
            if (this._initialised) {
                ComponentUtil.processOnChange(changes, this.gridOptions, this.api);
            }
        }

        public ngOnDestroy(): void {
            this.api.destroy();
        }

        private globalEventListener(eventType: string, event: any): void {
            var emitter: any;
            switch (eventType) {
                case Events.EVENT_ROW_GROUP_OPENED: emitter = this.rowGroupOpened; break;
                case Events.EVENT_COLUMN_GROUP_OPENED: emitter = this.columnGroupOpened; break;
                case Events.EVENT_COLUMN_EVERYTHING_CHANGED: emitter = this.columnEverythingChanged; break;
                case Events.EVENT_COLUMN_MOVED: emitter = this.columnMoved; break;
                case Events.EVENT_COLUMN_ROW_GROUP_CHANGE: emitter = this.columnRowGroupChanged; break;
                case Events.EVENT_COLUMN_RESIZED: emitter = this.columnResized; break;
                case Events.EVENT_COLUMN_VALUE_CHANGE: emitter = this.columnValueChanged; break;
                case Events.EVENT_COLUMN_VISIBLE: emitter = this.columnVisible; break;
                case Events.EVENT_MODEL_UPDATED: emitter = this.modelUpdated; break;
                case Events.EVENT_CELL_CLICKED: emitter = this.cellClicked; break;
                case Events.EVENT_CELL_DOUBLE_CLICKED: emitter = this.cellDoubleClicked; break;
                case Events.EVENT_CELL_CONTEXT_MENU: emitter = this.cellContextMenu; break;
                case Events.EVENT_CELL_VALUE_CHANGED: emitter = this.cellValueChanged; break;
                case Events.EVENT_CELL_FOCUSED: emitter = this.cellFocused; break;
                case Events.EVENT_ROW_SELECTED: emitter = this.rowSelected; break;
                case Events.EVENT_ROW_DESELECTED: emitter = this.rowDeselected; break;
                case Events.EVENT_SELECTION_CHANGED: emitter = this.selectionChanged; break;
                case Events.EVENT_BEFORE_FILTER_CHANGED: emitter = this.beforeFilterChanged; break;
                case Events.EVENT_AFTER_FILTER_CHANGED: emitter = this.afterFilterChanged; break;
                case Events.EVENT_AFTER_SORT_CHANGED: emitter = this.afterSortChanged; break;
                case Events.EVENT_BEFORE_SORT_CHANGED: emitter = this.beforeSortChanged; break;
                case Events.EVENT_FILTER_MODIFIED: emitter = this.filterModified; break;
                case Events.EVENT_VIRTUAL_ROW_REMOVED: emitter = this.virtualRowRemoved; break;
                case Events.EVENT_ROW_CLICKED: emitter = this.rowClicked; break;
                case Events.EVENT_ROW_DOUBLE_CLICKED: emitter = this.rowDoubleClicked; break;
                case Events.EVENT_READY: emitter = this.ready; break;
                case Events.EVENT_GRID_SIZE_CHANGED: emitter = this.ready; break;
                default:
                    console.log('ag-Grid: AgGridNg2 - unknown event type: ' + eventType);
                    return;
            }
            emitter.next(event);
        }
    }

    // check for angular and component, as if angular 1, we will find angular but the wrong version
    if (typeof (window) !== 'undefined') { // this check was needed for unit tests, otherwise window undefined error below
        if (window && (<any> window).ng && (<any> window).ng.core && (<any> window).ng.core.Component) {
            var ng = (<any> window).ng;
            initialiseAgGridWithAngular2(ng);
            // check if we are using SystemX
            // taking this out, as it was upsetting people who used SystemX but didn't use Angular2,
            // as it was resulting in a failed 'Fetch' of the Angular2 system
        //} else if ((<any>window).System && (<any>window).System.import) {
        //    (<any>window).System.import('angular2/angular2').then( function(ngFromSystemX: any) {
        //        var ng = ngFromSystemX;
        //        initialiseAgGridWithAngular2(ng);
        //    });
        }
    }

    export function initialiseAgGridWithAngular2(ng: any) {
        _ng = ng;
        (<any>AgGridNg2).annotations = [
            new _ng.core.Component({
                selector: 'ag-grid-ng2',
                outputs: ComponentUtil.EVENTS,
                inputs: ComponentUtil.ALL_PROPERTIES.concat(['gridOptions']),
                compileChildren: false // no angular on the inside thanks
            }),
            new _ng.core.View({
                template: '',
                // tell angular we don't want view encapsulation, we don't want a shadow root
                encapsulation: _ng.core.ViewEncapsulation.None
            })
        ];
        (<any>AgGridNg2).parameters = [[_ng.core.ElementRef]];
    }

}
