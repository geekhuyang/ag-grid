/// <references path='events.ts'/>

module agGrid {

    export class ColumnChangeEvent {

        private type: string;
        // set if event impacts one column
        private column: Column;
        // se if event impacts multiple columns
        private columns: Column[];
        private columnGroup: ColumnGroup;
        private fromIndex: number;
        private toIndex: number;
        private finished: boolean;
        private visible: boolean;
        private pinned: string;

        constructor(type: string) {
            this.type = type;
        }

        public toString(): string {
            var result = 'ColumnChangeEvent {type: ' + this.type;
            if (this.column) { result += ', column: ' + this.column.getColId(); }
            if (this.columnGroup) { result += ', columnGroup: ' + this.columnGroup.getColGroupDef() ? this.columnGroup.getColGroupDef().headerName : '(not defined]'; }
            if (this.fromIndex) { result += ', fromIndex: ' + this.fromIndex; }
            if (this.toIndex) { result += ', toIndex: ' + this.toIndex; }
            if (this.visible) { result += ', visible: ' + this.visible; }
            if (this.pinned) { result += ', pinned: ' + this.pinned; }
            if (typeof this.finished == 'boolean') { result += ', finished: ' + this.finished; }
            result += '}';
            return result;
        }

        public withPinned(pinned: string): ColumnChangeEvent {
            this.pinned = pinned;
            return this;
        }

        public withVisible(visible: boolean): ColumnChangeEvent {
            this.visible = visible;
            return this;
        }

        public isVisible(): boolean {
            return this.visible;
        }

        public getPinned(): string {
            return this.pinned;
        }

        public withColumn(column: Column): ColumnChangeEvent {
            this.column = column;
            return this;
        }

        public withColumns(columns: Column[]): ColumnChangeEvent {
            this.columns = columns;
            return this;
        }

        public withFinished(finished: boolean): ColumnChangeEvent {
            this.finished = finished;
            return this;
        }

        public withColumnGroup(columnGroup: ColumnGroup): ColumnChangeEvent {
            this.columnGroup = columnGroup;
            return this;
        }

        public withFromIndex(fromIndex: number): ColumnChangeEvent {
            this.fromIndex = fromIndex;
            return this;
        }

        public withToIndex(toIndex: number): ColumnChangeEvent {
            this.toIndex = toIndex;
            return this;
        }

        public getFromIndex(): number  {
            return this.fromIndex;
        }

        public getToIndex(): number  {
            return this.toIndex;
        }

        public getType(): string {
            return this.type;
        }

        public getColumn(): Column {
            return this.column;
        }

        public getColumns(): Column[] {
            return this.columns;
        }

        public getColumnGroup(): ColumnGroup {
            return this.columnGroup;
        }

        public isRowGroupChanged(): boolean {
            return this.type === Events.EVENT_COLUMN_ROW_GROUP_CHANGE || this.type === Events.EVENT_COLUMN_EVERYTHING_CHANGED;
        }

        public isValueChanged(): boolean {
            return this.type === Events.EVENT_COLUMN_VALUE_CHANGE || this.type === Events.EVENT_COLUMN_EVERYTHING_CHANGED;
        }

        public isIndividualColumnResized(): boolean {
            return this.type === Events.EVENT_COLUMN_RESIZED && this.column !== undefined && this.column !== null;
        }

        public isFinished(): boolean {
            return this.finished;
        }

    }

}