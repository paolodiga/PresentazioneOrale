import { UIPanel, UIText, UIRow } from './libs/ui.js';
import { UIBoolean } from './libs/ui.three.js';


function SidebarProjectViewport(editor ) {

	let signals = editor.signals;
	let strings = editor.strings;

	let container = new UIPanel();

	let headerRow = new UIRow();
	headerRow.add( new UIText( strings.getKey( 'sidebar/settings/viewport' ).toUpperCase() ) );
	container.add( headerRow );

	// grid

	let showGridRow = new UIRow();

	showGridRow.add( new UIText( strings.getKey( 'sidebar/settings/viewport/grid' ) ).setWidth( '90px' ) );

	let showGrid = new UIBoolean( true ).onChange( function () {
		signals.showGridChanged.dispatch( showGrid.getValue() );

	} );
	showGridRow.add( showGrid );
	container.add( showGridRow );

	// helpers

	let showHelpersRow = new UIRow();

	showHelpersRow.add( new UIText( strings.getKey( 'sidebar/settings/viewport/helpers' ) ).setWidth( '90px' ) );

	let showHelpers = new UIBoolean( true ).onChange( function () {

		signals.showHelpersChanged.dispatch( showHelpers.getValue() );

	} );
	showHelpersRow.add( showHelpers );
	container.add( showHelpersRow );

	return container;

}

export { SidebarProjectViewport };
