<?php
$key = "Getting Started ng2";
$pageTitle = "Best Angular 2 Data Grid";
$pageDescription = "Demonstrate the best Angular 2 data grid. Shows and example of a data grid for using with Angular 2.";
$pageKeyboards = "Angular 2 Grid";
include '../documentation_header.php';
?>

<div>

    <h2>Best Angular 2.0 Data Grid</h2>

    <h4>AngularJS 2 Still in Beta</h4>

    <p>
        ag-Grid's integration is been developed against beta versions of AngularJS 2.
        Until the final version is released, ag-Grid's integration with AngularJS 2
        is also liable to change. The examples below work with Angular version 2.0.0-beta.0.
        At the time of writing, that was the latest version.
    </p>

    <h4>Self Extracting AngularJS 2</h4>

    <p>
        AngularJS 2 was written for TypeScript and ECMA 6 module loading.
        However this is not mandatory, you can use the UMD
        version of AngularJS if you don't want to use ECMA 6 module loading
        and / or TypeScript. For simplicity, and to minimise the barrier
        to entry, the examples in this documentation use Javascript and
        the UMD version of AngularJS 2.
    </p>

    <p>
        For notes on JSPM, see the section on JSPM below.
    </p>

    <p>
        For a full working example using Typescript, please see
        <a href="https://github.com/helix46/ag-grid-angular2-beta-ts">
        https://github.com/helix46/ag-grid-angular2-beta-ts</a>,
        kindly provided by helix46.
    </p>

    <h2>Simple AngularJS 2 Example</h2>

    <p>
        Below shows a step by step guide on setting up ag-Grid with an AngularJS 2 application
        using Javascript.
    </p>

    <h4>Include Dependencies</h4>

    <p>
        Include the dependencies for the application in the <i>head</i> section of your html.
    </p>

    <pre>&lt;!-- This is the UMD version of AngularJS 2.0 -->
&lt;script src="http://code.angularjs.org/2.0.0-beta.0/Rx.umd.js">&lt;/script>
&lt;script src="http://code.angularjs.org/2.0.0-beta.0/angular2-polyfills.js">&lt;/script>
&lt;script src="http://code.angularjs.org/2.0.0-beta.0/angular2-all.umd.js">&lt;/script>

&lt;!-- include ag-Grid javascript file -->
&lt;script src="../dist/ag-grid.js">&lt;/script>

&lt;!-- include your application code, after ag-Grid and AngularJS as it depends on both -->
&lt;script src="exampleSimpleNg2.js">&lt;/script>

&lt;!-- include stylesheets for the grid -->
&lt;link rel="stylesheet" type="text/css" href="../dist/ag-grid.css">
&lt;link rel="stylesheet" type="text/css" href="../dist/theme-fresh.css"></pre>

    <h4>
        Simple App Root Component
    </h4>

    <p>
        You can't have the grid as your root component as you need your application outside
        the grid to provide details to the grid.
    </p>

    <p>
        In your HTML, include a root component as follows:
    </p>
    <pre>&lt;simple-ng2-grid/></pre>

    <p>
        Then in your Javascript, you need to define your component. Doing this use AngularJS UMD
        and Javascript (not Typescript) is done as follows:
    </p>

    <pre>// define a function to act as the class for the component
var SampleAppComponent = function() {}

// add AngularJS 2 annotations to the function
SampleAppComponent.annotations = [
    new ng.core.Component({
        // tell AngularJS to match the &lt;simple-ng2-grid> tag
        selector: 'simple-ng2-grid'
    }),
    new ng.core.View({
        // tell AngularJS that the SimpleAppComponent directive
        // uses the ag-Grid directive
        directives: [agGrid.AgGridNg2],
        // the template for our component
        template: templateForSampleAppComponent
    })
];
</pre>

    <h4>Simple App Template</h4>

    <p>
        In the example, the constructor sets the row data and column definitions onto
        the component instance, which is then available to the components template
        for binding. The template for Simple App only has one element, the ag-Grid
        element.
    </p>

    <pre>&lt;ag-grid-ng2
    // use one of the ag-Grid themes
    class="ag-fresh"
    // give some size to the grid
    style="height: 100%;"
    // use AngularJS 2 properties for columnDefs and rowData
    [columnDefs]="columnDefs"
    [rowData]="rowData"
/></pre>

    <p>
        The example shows use of AngularJS property bindings. The grid has full support for
        AngularJS property bindings, events and attributes. The simple example doesn't show
        it all. See the complex example below for more meat.
    </p>

    <h4>Simple App Bootstrap</h4>

    <p>
        Then when everything is defined, we can bootstrap this mother, as follows:
    </p>

    <pre>document.addEventListener('DOMContentLoaded', function () {
    ng.platform.browser.bootstrap(SampleAppComponent);
});
</pre>

    <show-example example="exampleSimpleNg2"></show-example>

    <h2>Complex AngularJS 2 Example</h2>

    <p>
        Now we are ready to get more of AngularJS 2 involved!
        The example below demonstrates the following:
    </p>

    <ul>
        <li><b>Events:</b> All data out of the grid comes through events. These use
            Angular 2 event bindings eg <i>(modelUpdated)="onModelUpdated()"</i>.
            As you interact with the grid, the different events are fixed and
            output text to the console (open the dev tools to see the console).
        </li>
        <li><b>Properties:</b> All the data is provided to the grid as Angular 2
            bindings. These are bound onto the ag-Grid properties bypassing the
            elements attributes. The values for the bindings come from the parent
            controller.
        </li>
        <li><b>Attributes:</b> When the property is just a simple string value, then
            no binding is necessary, just the value is placed as an attribute
            eg <i>rowHeight="22"</i>. Notice that boolean attributes are defaulted
            to 'true' IF they attribute is provided WITHOUT any value. If the attribute
            is not provided, it is taken as false.
        </li>
        <li><b>Grid API via IDs:</b> The grid in the example is created with an id
            by marking it with <i>#agGrid</i>. This in turn turns into a variable
            which can be used to access the grid's controller. The buttons
            Grid API and Column API buttons use this variable to access the grids
            API (the API's are attributes on the controller).
        </li>
        <li><b>Changing Properties:</b> When a property changes value, AngularJS
            automatically passes the new value onto the grid. This is used in
            the following locations:<br/>
            a) The 'quickFilter' on the top right updates the quick filter of
            the grid.
            b) The 'Show Tool Panel' checkbox has it's value bound to the 'showToolPanel'
            property of the grid.
            c) The 'Refresh Data' generates new data for the grid and updates the
            <i>rowData</i> property.
        </li>
    </ul>

    <p>
        Notice that the grid has it's properties marked as <b>immutable</b>. Hence for
        object properties, the object reference must change for the grid to take impact.
        For example, <i>rowData</i> must be a new list of data for the grid to be
        informed to redraw.
    </p>

    <show-example example="exampleNg2" extra-pages="sampleAppComponent.html"></show-example>

    <note>
        I tested the above examples to work on my Windows 8 machine with latest Chrome, Microsoft Edge
        and Firefox. It didn't work on Safari or Internet Explorer with an ng2 error. I'm not worried about
        it as I'm assuming these are AngularJS issues that will be fixed in their final release as ag-Grid works
        fine in these browsers without using Angular.
    </note>

    <h2>Angular Compiling</h2>

    <p>Angular Compiling is NOT supported inside ag-Grid for Angular 2.</p>

    <note>
        <p>
            The grid does not use the Angular 2 compile service the same way it does for Angular 1. I spoke to some of the Angular team about this at Angular Connect in London in October 2014. Basically the Angular 2's compile service doesn't work like that in Angular 1. Angular 2 compiles everything at application start, and then the compile service is no longer available. It is not intended by Angular 2 for the application to use the compile service after the application has finished initialising. ag-Grid discovers the template at run-time and builds it's own html, so needs the compile service at run-time.
        </p>
        <p>
            What can be done in Angular 2 is the compile service can be made available again (I do not know how to do this yet) and then I can use it as I was using the similar service in Angular 1, but because Angular 2 is still in beta, I didn't want to invest my time in this (very undocumented) approach. It also 'did not sound like a good idea for performance reasons' with the Angular 2 team, so I'm weary that this use-case has been catered for properly in Angular 2.
        </p>
        <p>
            So, long story short, until Angular 2 is out of beta and someone can provide me with the best practice approach for using the Angular 2 compile service, ag-Grid won't support internal Angular 2 bindings.
        </p>
    </note>

    <h2>Destroy</h2>

    <p>
        You do not need to manually clean up the grid. The grid ties in with the AngularJS 2 lifecycle
        and releases all resources when the directive is destroyed. The example above demonstrates this
        by taking the element out of the DOM via *ngIf (which, unlike *ng-show, destroys the directives).
    </p>

    <h2>JSPM</h2>

    <p>
        To get one version of the grid to work with all technologies required one Javascript file
        to work regardless of you using JSPM, CommonJS, Angular 1 or 2, or no Angular at all, had
        one pitfall for me. That was JSPM loading of the Angular 2 library (as this will cause and
        error if Angular 2 is not available, which will be the case if you are using Angular 1 or
        no Angular at all). To get around this, you have to initialise the grid with Angular 2 if
        using JSPM. This is done as follows:
    </p>

    <pre>System.import('angular2/angular2').then( function(ng2) {
    ag.grid.initialiseAgGridWithAngular2(ng2);
});</pre>

    <h2>Ready Event</h2>

    <p>
        Note that Angular 2 also throws a ready event. So if you are listening for the ready event
        via Angular 2 binding, you will get two events, one from Angular 2, one from ag-Grid.
        The event from ag-Grid will have the attributes api and columnApi which you can check for.
        <pre><code>function onReady(event) {
    if (event.api) {
        // this is the ag-Grid event
    } else {
        // this is the Angular 2 event
    }
}</code></pre>
    </p>

    <h2>Next Steps...</h2>

    <p>
        Now you can go to <a href="../javascript-grid-interfacing-overview/index.php">interfacing</a>
        to learn about accessing all the features of the grid.
    </p>

</div>

<?php include '../documentation_footer.php';?>
