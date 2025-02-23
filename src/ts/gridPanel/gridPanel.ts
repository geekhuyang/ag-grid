/// <reference path="../utils.ts" />
/// <reference path="../layout/borderLayout.ts" />

module agGrid {

    // the long lines below are on purpose, otherwise there is while space between some of the dives that
    // we do not want to have, and this white space ends up as gaps in some of the browsers
    var gridHtml =
            `<div>
                <!-- header -->
                <div class="ag-header">
                    <div class="ag-pinned-left-header"></div><div class="ag-pinned-right-header"></div><div class="ag-header-viewport"><div class="ag-header-container"></div></div>
                </div>
                <!-- floating top -->
                <div class="ag-floating-top">
                    <div class="ag-pinned-left-floating-top"></div><div class="ag-pinned-right-floating-top"></div><div class="ag-floating-top-viewport"><div class="ag-floating-top-container"></div></div>
                </div>
                <!-- floating bottom -->
                <div class="ag-floating-bottom">
                    <div class="ag-pinned-left-floating-bottom"></div><div class="ag-pinned-right-floating-bottom"></div><div class="ag-floating-bottom-viewport"><div class="ag-floating-bottom-container"></div></div>
                </div>
                <!-- body -->
                <div class="ag-body">
                    <div class="ag-pinned-left-cols-viewport">
                        <div class="ag-pinned-left-cols-container"></div>
                    </div>
                    <div class="ag-pinned-right-cols-viewport">
                        <div class="ag-pinned-right-cols-container"></div>
                    </div>
                    <div class="ag-body-viewport-wrapper">
                        <div class="ag-body-viewport">
                            <div class="ag-body-container"></div>
                        </div>
                    </div>
                </div>
            </div>`;

    var gridForPrintHtml =
            `<div>
                <!-- header -->
                <div class="ag-header-container"></div>
                <!-- floating top -->
                <div class="ag-floating-top-container"></div>
                <!-- body -->
                <div class="ag-body-container"></div>
                <!-- floating bottom -->
                <div class="ag-floating-bottom-container"></div>
            </div>`;

    // wrapping in outer div, and wrapper, is needed to center the loading icon
    // The idea for centering came from here: http://www.vanseodesign.com/css/vertical-centering/
    var mainOverlayTemplate =
        '<div class="ag-overlay-panel">'+
            '<div class="ag-overlay-wrapper ag-overlay-[OVERLAY_NAME]-wrapper">[OVERLAY_TEMPLATE]</div>'+
        '</div>';

    var defaultLoadingOverlayTemplate = '<span class="ag-overlay-loading-center">[LOADING...]</span>';
    var defaultNoRowsOverlayTemplate = '<span class="ag-overlay-no-rows-center">[NO_ROWS_TO_SHOW]</span>';

    var _ = Utils;

    export class GridPanel {

        private masterSlaveService: MasterSlaveService;
        private gridOptionsWrapper: GridOptionsWrapper;
        private columnModel: ColumnController;
        private rowRenderer: RowRenderer;
        private rowModel: any;
        private floatingRowModel: FloatingRowModel;

        private layout: BorderLayout;
        private logger: Logger;

        private forPrint: boolean;
        private scrollWidth: number;
        private scrollLagCounter = 0;

        private eBodyViewport: HTMLElement;
        private eRoot: HTMLElement;
        private eBody: HTMLElement;
        private eBodyContainer: HTMLElement;
        private ePinnedLeftColsContainer: HTMLElement;
        private ePinnedRightColsContainer: HTMLElement;
        private eHeaderContainer: HTMLElement;
        private ePinnedLeftHeader: HTMLElement;
        private ePinnedRightHeader: HTMLElement;
        private eHeader: HTMLElement;
        private eParentsOfRows: HTMLElement[];
        private eBodyViewportWrapper: HTMLElement;
        private ePinnedLeftColsViewport: HTMLElement;
        private ePinnedRightColsViewport: HTMLElement;
        private eHeaderViewport: HTMLElement;

        private eFloatingTop: HTMLElement;
        private ePinnedLeftFloatingTop: HTMLElement;
        private ePinnedRightFloatingTop: HTMLElement;
        private eFloatingTopContainer: HTMLElement;

        private eFloatingBottom: HTMLElement;
        private ePinnedLeftFloatingBottom: HTMLElement;
        private ePinnedRightFloatingBottom: HTMLElement;
        private eFloatingBottomContainer: HTMLElement;

        private lastLeftPosition = -1;
        private lastTopPosition = -1;

        public init(gridOptionsWrapper: GridOptionsWrapper, columnModel: ColumnController, rowRenderer: RowRenderer,
                    masterSlaveService: MasterSlaveService, loggerFactory: LoggerFactory, floatingRowModel: FloatingRowModel) {
            this.gridOptionsWrapper = gridOptionsWrapper;
            // makes code below more readable if we pull 'forPrint' out
            this.forPrint = this.gridOptionsWrapper.isForPrint();
            this.setupComponents();
            this.scrollWidth = _.getScrollbarWidth();

            this.columnModel = columnModel;
            this.rowRenderer = rowRenderer;
            this.masterSlaveService = masterSlaveService;
            this.floatingRowModel = floatingRowModel;
            this.logger = loggerFactory.create('GridPanel');
        }

        public getLayout(): BorderLayout {
            return this.layout;
        }

        private setupComponents() {

            if (this.forPrint) {
                this.eRoot = <HTMLElement> _.loadTemplate(gridForPrintHtml);
                _.addCssClass(this.eRoot, 'ag-root ag-no-scrolls');
            } else {
                this.eRoot = <HTMLElement> _.loadTemplate(gridHtml);
                _.addCssClass(this.eRoot, 'ag-root ag-scrolls');
            }

            this.findElements();

            this.layout = new BorderLayout({
                overlays: {
                    loading: _.loadTemplate(this.createLoadingOverlayTemplate()),
                    noRows: _.loadTemplate(this.createNoRowsOverlayTemplate())
                },
                center: this.eRoot,
                dontFill: this.forPrint,
                name: 'eGridPanel'
            });

            this.layout.addSizeChangeListener(this.onBodyHeightChange.bind(this));

            this.addScrollListener();

            if (this.gridOptionsWrapper.isSuppressHorizontalScroll()) {
                this.eBodyViewport.style.overflowX = 'hidden';
            }
        }

        public getPinnedLeftFloatingTop(): HTMLElement {
            return this.ePinnedLeftFloatingTop;
        }

        public getPinnedRightFloatingTop(): HTMLElement {
            return this.ePinnedRightFloatingTop;
        }

        public getFloatingTopContainer(): HTMLElement {
            return this.eFloatingTopContainer;
        }

        public getPinnedLeftFloatingBottom(): HTMLElement {
            return this.ePinnedLeftFloatingBottom;
        }

        public getPinnedRightFloatingBottom(): HTMLElement {
            return this.ePinnedRightFloatingBottom;
        }

        public getFloatingBottomContainer(): HTMLElement {
            return this.eFloatingBottomContainer;
        }

        private createOverlayTemplate(name: string, defaultTemplate: string, userProvidedTemplate: string): string {

            var template = mainOverlayTemplate
                .replace('[OVERLAY_NAME]', name);

            if (userProvidedTemplate) {
                template = template.replace('[OVERLAY_TEMPLATE]', userProvidedTemplate);
            } else {
                template = template.replace('[OVERLAY_TEMPLATE]', defaultTemplate);
            }

            return template;
        }

        private createLoadingOverlayTemplate(): string {

            var userProvidedTemplate = this.gridOptionsWrapper.getOverlayLoadingTemplate();

            var templateNotLocalised = this.createOverlayTemplate(
                'loading',
                defaultLoadingOverlayTemplate,
                userProvidedTemplate);

            var localeTextFunc = this.gridOptionsWrapper.getLocaleTextFunc();
            var templateLocalised = templateNotLocalised.replace('[LOADING...]', localeTextFunc('loadingOoo', 'Loading...'));

            return templateLocalised;
        }

        private createNoRowsOverlayTemplate(): string {
            var userProvidedTemplate = this.gridOptionsWrapper.getOverlayNoRowsTemplate();

            var templateNotLocalised = this.createOverlayTemplate(
                'no-rows',
                defaultNoRowsOverlayTemplate,
                userProvidedTemplate);

            var localeTextFunc = this.gridOptionsWrapper.getLocaleTextFunc();
            var templateLocalised = templateNotLocalised.replace('[NO_ROWS_TO_SHOW]', localeTextFunc('noRowsToShow', 'No Rows To Show'));

            return templateLocalised;
        }

        public ensureIndexVisible(index: any) {
            this.logger.log('ensureIndexVisible: ' + index);
            var lastRow = this.rowModel.getVirtualRowCount();
            if (typeof index !== 'number' || index < 0 || index >= lastRow) {
                console.warn('invalid row index for ensureIndexVisible: ' + index);
                return;
            }

            var nodeAtIndex = this.rowModel.getVirtualRow(index);
            var rowTopPixel = nodeAtIndex.rowTop;
            var rowBottomPixel = rowTopPixel + nodeAtIndex.rowHeight;

            var viewportTopPixel = this.eBodyViewport.scrollTop;
            var viewportHeight = this.eBodyViewport.offsetHeight;
            var scrollShowing = this.isHorizontalScrollShowing();
            if (scrollShowing) {
                viewportHeight -= this.scrollWidth;
            }
            var viewportBottomPixel = viewportTopPixel + viewportHeight;

            var viewportScrolledPastRow = viewportTopPixel > rowTopPixel;
            var viewportScrolledBeforeRow = viewportBottomPixel < rowBottomPixel;

            var eViewportToScroll = this.columnModel.isPinningRight() ? this.ePinnedRightColsViewport : this.eBodyViewport;
            if (viewportScrolledPastRow) {
                // if row is before, scroll up with row at top
                eViewportToScroll.scrollTop = rowTopPixel;
            } else if (viewportScrolledBeforeRow) {
                // if row is below, scroll down with row at bottom
                var newScrollPosition = rowBottomPixel - viewportHeight;
                eViewportToScroll.scrollTop = newScrollPosition;
            }
            // otherwise, row is already in view, so do nothing
        }

        public isHorizontalScrollShowing(): boolean {
            var result = this.eBodyViewport.clientWidth < this.eBodyViewport.scrollWidth;
            return result;
        }

        public isVerticalScrollShowing(): boolean {
            if (this.columnModel.isPinningRight()) {
                // if pinning right, then the scroll bar can show, however for some reason
                // it overlays the grid and doesn't take space.
                return false;
            } else {
                return this.eBodyViewport.clientHeight < this.eBodyViewport.scrollHeight
            }
        }

        // gets called every 500 ms. we use this to set padding on right pinned column
        public periodicallyCheck(): void {
            if (this.columnModel.isPinningRight()) {
                var bodyHorizontalScrollShowing = this.eBodyViewport.clientWidth < this.eBodyViewport.scrollWidth;
                if (bodyHorizontalScrollShowing) {
                    this.ePinnedRightColsContainer.style.marginBottom = this.scrollWidth + 'px';
                } else {
                    this.ePinnedRightColsContainer.style.marginBottom = '';
                }
            }
        }

        public ensureColIndexVisible(index: any) {
            var leftColumns = this.columnModel.getDisplayedLeftColumns();
            var centerColumns = this.columnModel.getDisplayedCenterColumns();

            var minAllowedIndex = leftColumns.length;
            var maxAllowedIndex = minAllowedIndex + centerColumns.length - 1;

            var indexIsInRange = index >= minAllowedIndex && index <= maxAllowedIndex;
            if (!indexIsInRange) {
                console.warn('index is not in range, should be between '
                    + minAllowedIndex + ' and ' + maxAllowedIndex);
                console.warn('Remember it makes no sense to scroll to a pinned column');
                return;
            }

            var centerIndex = index - leftColumns.length;
            var column = centerColumns[centerIndex];

            // sum up all col width to the let to get the start pixel
            var colLeftPixel = 0;
            for (var i = 0; i < centerIndex; i++) {
                colLeftPixel += centerColumns[i].getActualWidth();
            }

            var colRightPixel = colLeftPixel + column.getActualWidth();

            var viewportLeftPixel = this.eBodyViewport.scrollLeft;
            var viewportWidth = this.eBodyViewport.offsetWidth;

            var scrollShowing = this.eBodyViewport.clientHeight < this.eBodyViewport.scrollHeight;
            if (scrollShowing) {
                viewportWidth -= this.scrollWidth;
            }

            var viewportRightPixel = viewportLeftPixel + viewportWidth;

            var viewportScrolledPastCol = viewportLeftPixel > colLeftPixel;
            var viewportScrolledBeforeCol = viewportRightPixel < colRightPixel;

            if (viewportScrolledPastCol) {
                // if viewport's left side is after col's left side, scroll right to pull col into viewport at left
                this.eBodyViewport.scrollLeft = colLeftPixel;
            } else if (viewportScrolledBeforeCol) {
                // if viewport's right side is before col's right side, scroll left to pull col into viewport at right
                var newScrollPosition = colRightPixel - viewportWidth;
                this.eBodyViewport.scrollLeft = newScrollPosition;
            }
            // otherwise, col is already in view, so do nothing
        }

        public showLoadingOverlay(): void {
            if (!this.gridOptionsWrapper.isSuppressLoadingOverlay()) {
                this.layout.showOverlay('loading');
            }
        }

        public showNoRowsOverlay(): void {
            if (!this.gridOptionsWrapper.isSuppressNoRowsOverlay()) {
                this.layout.showOverlay('noRows');
            }
        }

        public hideOverlay(): void {
            this.layout.hideOverlay();
        }

        private getWidthForSizeColsToFit() {
            var availableWidth = this.eBody.clientWidth;
            var scrollShowing = this.isVerticalScrollShowing();
            if (scrollShowing) {
                availableWidth -= this.scrollWidth;
            }
            return availableWidth;
        }

        // method will call itself if no available width. this covers if the grid
        // isn't visible, but is just about to be visible.
        public sizeColumnsToFit(nextTimeout?: number) {
            var availableWidth = this.getWidthForSizeColsToFit();
            if (availableWidth>0) {
                this.columnModel.sizeColumnsToFit(availableWidth);
            } else {
                if (nextTimeout===undefined) {
                    setTimeout( ()=> {
                        this.sizeColumnsToFit(100);
                    }, 0);
                } else if (nextTimeout===100) {
                    setTimeout( ()=> {
                        this.sizeColumnsToFit(-1);
                    }, 100);
                } else {
                    console.log('ag-Grid: tried to call sizeColumnsToFit() but the grid is coming back with zero width, mabye the grid is not visible yet on the screen?');
                }
            }
        }

        public setRowModel(rowModel: any) {
            this.rowModel = rowModel;
        }

        public getBodyContainer() {
            return this.eBodyContainer;
        }

        public getBodyViewport() {
            return this.eBodyViewport;
        }

        public getPinnedLeftColsContainer() {
            return this.ePinnedLeftColsContainer;
        }

        public getPinnedRightColsContainer() {
            return this.ePinnedRightColsContainer;
        }

        public getHeaderContainer() {
            return this.eHeaderContainer;
        }

        public getRoot() {
            return this.eRoot;
        }

        public getPinnedLeftHeader() {
            return this.ePinnedLeftHeader;
        }

        public getPinnedRightHeader() {
            return this.ePinnedRightHeader;
        }

        public getRowsParent(): HTMLElement[] {
            return this.eParentsOfRows;
        }

        private queryHtmlElement(selector: string): HTMLElement {
            return <HTMLElement> this.eRoot.querySelector(selector);
        }

        private findElements() {
            if (this.forPrint) {
                this.eHeaderContainer = this.queryHtmlElement('.ag-header-container');
                this.eBodyContainer = this.queryHtmlElement('.ag-body-container');
                this.eFloatingTopContainer = this.queryHtmlElement('.ag-floating-top-container');
                this.eFloatingBottomContainer = this.queryHtmlElement('.ag-floating-bottom-container');

                this.eParentsOfRows = [this.eBodyContainer, this.eFloatingTopContainer, this.eFloatingBottomContainer];
            } else {
                this.eBody = this.queryHtmlElement('.ag-body');
                this.eBodyContainer = this.queryHtmlElement('.ag-body-container');
                this.eBodyViewport = this.queryHtmlElement('.ag-body-viewport');
                this.eBodyViewportWrapper = this.queryHtmlElement('.ag-body-viewport-wrapper');
                this.ePinnedLeftColsContainer = this.queryHtmlElement('.ag-pinned-left-cols-container');
                this.ePinnedRightColsContainer = this.queryHtmlElement('.ag-pinned-right-cols-container');
                this.ePinnedLeftColsViewport = this.queryHtmlElement('.ag-pinned-left-cols-viewport');
                this.ePinnedRightColsViewport = this.queryHtmlElement('.ag-pinned-right-cols-viewport');
                this.ePinnedLeftHeader = this.queryHtmlElement('.ag-pinned-left-header');
                this.ePinnedRightHeader = this.queryHtmlElement('.ag-pinned-right-header');
                this.eHeader = this.queryHtmlElement('.ag-header');
                this.eHeaderContainer = this.queryHtmlElement('.ag-header-container');
                this.eHeaderViewport = this.queryHtmlElement('.ag-header-viewport');

                this.eFloatingTop = this.queryHtmlElement('.ag-floating-top');
                this.ePinnedLeftFloatingTop = this.queryHtmlElement('.ag-pinned-left-floating-top');
                this.ePinnedRightFloatingTop = this.queryHtmlElement('.ag-pinned-right-floating-top');
                this.eFloatingTopContainer = this.queryHtmlElement('.ag-floating-top-container');

                this.eFloatingBottom = this.queryHtmlElement('.ag-floating-bottom');
                this.ePinnedLeftFloatingBottom = this.queryHtmlElement('.ag-pinned-left-floating-bottom');
                this.ePinnedRightFloatingBottom = this.queryHtmlElement('.ag-pinned-right-floating-bottom');
                this.eFloatingBottomContainer = this.queryHtmlElement('.ag-floating-bottom-container');

                // for scrolls, all rows live in eBody (containing pinned and normal body)
                this.eParentsOfRows = [this.eBody, this.eFloatingTop, this.eFloatingBottom];

                // IE9, Chrome, Safari, Opera
                this.ePinnedLeftColsViewport.addEventListener('mousewheel', this.pinnedLeftMouseWheelListener.bind(this));
                this.eBodyViewport.addEventListener('mousewheel', this.centerMouseWheelListener.bind(this));
                // Firefox
                this.ePinnedLeftColsViewport.addEventListener('DOMMouseScroll', this.pinnedLeftMouseWheelListener.bind(this));
                this.eBodyViewport.addEventListener('DOMMouseScroll', this.centerMouseWheelListener.bind(this));
            }
        }

        public getHeaderViewport(): HTMLElement {
            return this.eHeaderViewport;
        }

        private centerMouseWheelListener(event: any): boolean {
            // we are only interested in mimicking the mouse wheel if we are pinning on the right,
            // as if we are not pinning on the right, then we have scrollbars in the center body, and
            // as such we just use the default browser wheel behaviour.
            if (this.columnModel.isPinningRight()) {
                return this.generalMouseWheelListener(event, this.ePinnedRightColsViewport);
            }
        }

        private pinnedLeftMouseWheelListener(event: any): boolean {
            var targetPanel: HTMLElement;
            if (this.columnModel.isPinningRight()) {
                targetPanel = this.ePinnedRightColsViewport;
            } else {
                targetPanel = this.eBodyViewport;
            }
            return this.generalMouseWheelListener(event, targetPanel);
        }

        private generalMouseWheelListener(event: any, targetPanel: HTMLElement): boolean {
            var delta: number;
            if (event.deltaY && event.deltaX != 0) {
                // tested on chrome
                delta = event.deltaY;
            } else if (event.wheelDelta && event.wheelDelta != 0) {
                // tested on IE
                delta = -event.wheelDelta;
            } else if (event.detail && event.detail != 0) {
                // tested on Firefox. Firefox appears to be slower, 20px rather than the 100px in Chrome and IE
                delta = event.detail * 20;
            } else {
                // couldn't find delta
                return;
            }

            var newTopPosition = this.eBodyViewport.scrollTop + delta;
            targetPanel.scrollTop = newTopPosition;

            // if we don't prevent default, then the whole browser will scroll also as well as the grid
            event.preventDefault();
            return false;
        }

        public setBodyContainerWidth() {
            var mainRowWidth = this.columnModel.getBodyContainerWidth() + 'px';
            this.eBodyContainer.style.width = mainRowWidth;
            if (!this.forPrint) {
                this.eFloatingBottomContainer.style.width = mainRowWidth;
                this.eFloatingTopContainer.style.width = mainRowWidth;
            }
        }

        public setPinnedColContainerWidth() {
            if (this.forPrint) {
                // pinned col doesn't exist when doing forPrint
                return;
            }

            var pinnedLeftWidth = this.columnModel.getPinnedLeftContainerWidth() + 'px';
            this.ePinnedLeftColsContainer.style.width = pinnedLeftWidth;
            this.ePinnedLeftFloatingBottom.style.width = pinnedLeftWidth;
            this.ePinnedLeftFloatingTop.style.width = pinnedLeftWidth;
            this.eBodyViewportWrapper.style.marginLeft = pinnedLeftWidth;

            var pinnedRightWidth = this.columnModel.getPinnedRightContainerWidth() + 'px';
            this.ePinnedRightColsContainer.style.width = pinnedRightWidth;
            this.ePinnedRightFloatingBottom.style.width = pinnedRightWidth;
            this.ePinnedRightFloatingTop.style.width = pinnedRightWidth;
            this.eBodyViewportWrapper.style.marginRight = pinnedRightWidth;
        }

        public showPinnedColContainersIfNeeded() {
            // no need to do this if not using scrolls
            if (this.forPrint) {
                return;
            }

            //some browsers had layout issues with the blank divs, so if blank,
            //we don't display them
            if (this.columnModel.isPinningLeft()) {
                this.ePinnedLeftHeader.style.display = 'inline-block';
                this.ePinnedLeftColsViewport.style.display = 'inline';
            } else {
                this.ePinnedLeftHeader.style.display = 'none';
                this.ePinnedLeftColsViewport.style.display = 'none';
            }

            if (this.columnModel.isPinningRight()) {
                this.ePinnedRightHeader.style.display = 'inline-block';
                this.ePinnedRightColsViewport.style.display = 'inline';
                this.eBodyViewport.style.overflowY = 'hidden';
            } else {
                this.ePinnedRightHeader.style.display = 'none';
                this.ePinnedRightColsViewport.style.display = 'none';
                this.eBodyViewport.style.overflowY = 'auto';
            }
        }

        public onBodyHeightChange(): void {
            this.sizeHeaderAndBody();
        }

        private sizeHeaderAndBody(): void {
            if (this.forPrint) {
                this.sizeHeaderAndBodyForPrint();
            } else {
                this.sizeHeaderAndBodyNormal();
            }
        }

        private sizeHeaderAndBodyNormal(): void {
            var heightOfContainer = this.layout.getCentreHeight();
            if (!heightOfContainer) {
                return;
            }

            var headerHeight = this.gridOptionsWrapper.getHeaderHeight();
            var numberOfRowsInHeader = this.columnModel.getHeaderRowCount();
            var totalHeaderHeight = headerHeight * numberOfRowsInHeader;
            this.eHeader.style['height'] = totalHeaderHeight + 'px';

            // padding top covers the header and the floating rows on top
            var floatingTopHeight = this.floatingRowModel.getFloatingTopTotalHeight();
            var paddingTop = totalHeaderHeight + floatingTopHeight;
            // bottom is just the bottom floating rows
            var floatingBottomHeight = this.floatingRowModel.getFloatingBottomTotalHeight();
            var floatingBottomTop = heightOfContainer - floatingBottomHeight;

            var heightOfCentreRows = heightOfContainer - totalHeaderHeight - floatingBottomHeight - floatingTopHeight;

            this.eBody.style.paddingTop = paddingTop + 'px';
            this.eBody.style.paddingBottom = floatingBottomHeight + 'px';

            this.eFloatingTop.style.top = totalHeaderHeight + 'px';
            this.eFloatingTop.style.height = floatingTopHeight + 'px';
            this.eFloatingBottom.style.height = floatingBottomHeight + 'px';
            this.eFloatingBottom.style.top = floatingBottomTop + 'px';

            this.ePinnedLeftColsViewport.style.height = heightOfCentreRows + 'px';
            this.ePinnedRightColsViewport.style.height = heightOfCentreRows + 'px';
        }

        private sizeHeaderAndBodyForPrint(): void {
            var headerHeightPixels = this.gridOptionsWrapper.getHeaderHeight() + 'px';
            this.eHeaderContainer.style['height'] = headerHeightPixels;
        }

        public setHorizontalScrollPosition(hScrollPosition: number): void {
            this.eBodyViewport.scrollLeft = hScrollPosition;
        }

        private addScrollListener() {
            // if printing, then no scrolling, so no point in listening for scroll events
            if (this.forPrint) {
                return;
            }

            this.eBodyViewport.addEventListener('scroll', () => {

                // we are always interested in horizontal scrolls of the body
                var newLeftPosition = this.eBodyViewport.scrollLeft;
                if (newLeftPosition !== this.lastLeftPosition) {
                    this.lastLeftPosition = newLeftPosition;
                    this.horizontallyScrollHeaderCenterAndFloatingCenter(newLeftPosition);
                    this.masterSlaveService.fireHorizontalScrollEvent(newLeftPosition);
                }

                // if we are pinning to the right, then it's the right pinned container
                // that has the scroll.
                if (!this.columnModel.isPinningRight()) {
                    var newTopPosition = this.eBodyViewport.scrollTop;
                    if (newTopPosition !== this.lastTopPosition) {
                        this.lastTopPosition = newTopPosition;
                        this.verticallyScrollLeftPinned(newTopPosition);
                        this.requestDrawVirtualRows();
                    }
                }
            });

            this.ePinnedRightColsViewport.addEventListener('scroll', () => {
                var newTopPosition = this.ePinnedRightColsViewport.scrollTop;
                if (newTopPosition !== this.lastTopPosition) {
                    this.lastTopPosition = newTopPosition;
                    this.verticallyScrollLeftPinned(newTopPosition);
                    this.verticallyScrollBody(newTopPosition);
                    this.requestDrawVirtualRows();
                }
            });

            // this means the pinned panel was moved, which can only
            // happen when the user is navigating in the pinned container
            // as the pinned col should never scroll. so we rollback
            // the scroll on the pinned.
            this.ePinnedLeftColsViewport.addEventListener('scroll', () => {
                this.ePinnedLeftColsViewport.scrollTop = 0;
            });
        }

        private requestDrawVirtualRows() {
            // if we are in IE or Safari, then we only redraw if there was no scroll event
            // in the 50ms following this scroll event. without this, these browsers have
            // a bad scrolling feel, where the redraws clog the scroll experience
            // (makes the scroll clunky and sticky). this method is like throttling
            // the scroll events.
            var useScrollLag: boolean;
            // let the user override scroll lag option
            if (this.gridOptionsWrapper.isSuppressScrollLag()) {
                useScrollLag = false;
            } else if (this.gridOptionsWrapper.getIsScrollLag()) {
                useScrollLag = this.gridOptionsWrapper.getIsScrollLag()();
            } else {
                useScrollLag = _.isBrowserIE() || _.isBrowserSafari();
            }
            if (useScrollLag) {
                this.scrollLagCounter++;
                var scrollLagCounterCopy = this.scrollLagCounter;
                setTimeout( ()=> {
                    if (this.scrollLagCounter === scrollLagCounterCopy) {
                        this.rowRenderer.drawVirtualRows();
                    }
                }, 50);
            // all other browsers, afaik, are fine, so just do the redraw
            } else {
                this.rowRenderer.drawVirtualRows();
            }
        }

        private horizontallyScrollHeaderCenterAndFloatingCenter(bodyLeftPosition: any) {
            // this.eHeaderContainer.style.transform = 'translate3d(' + -bodyLeftPosition + 'px,0,0)';
            this.eHeaderContainer.style.left = -bodyLeftPosition + 'px';
            this.eFloatingBottomContainer.style.left = -bodyLeftPosition + 'px';
            this.eFloatingTopContainer.style.left = -bodyLeftPosition + 'px';
        }

        private verticallyScrollLeftPinned(bodyTopPosition: any) {
            // this.ePinnedColsContainer.style.transform = 'translate3d(0,' + -bodyTopPosition + 'px,0)';
            this.ePinnedLeftColsContainer.style.top = -bodyTopPosition + 'px';
        }

        private verticallyScrollBody(position: any) {
            this.eBodyViewport.scrollTop = position;
        }
    }
}

