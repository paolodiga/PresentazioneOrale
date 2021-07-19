import * as THREE from '../build/three.module.js';

import { UIPanel, UIRow, UIText } from './libs/ui.js';
import { UIBoolean } from './libs/ui.three.js';

function SidebarProjectRenderer( editor ) {

	let config = editor.config;
	let signals = editor.signals;
	let strings = editor.strings;

	let currentRenderer = null;

	let container = new UIPanel();

	let headerRow = new UIRow();
	headerRow.add( new UIText( strings.getKey( 'sidebar/project/renderer' ).toUpperCase() ) );
	container.add( headerRow );

	// Antialias

	let antialiasRow = new UIRow();
	container.add( antialiasRow );

	antialiasRow.add( new UIText( strings.getKey( 'sidebar/project/antialias' ) ).setWidth( '90px' ) );

	let antialiasBoolean = new UIBoolean( config.getKey( 'project/renderer/antialias' ) ).onChange( createRenderer );
	antialiasRow.add( antialiasBoolean );
	
	function createRenderer() {

		currentRenderer = new THREE.WebGLRenderer( { antialias: antialiasBoolean.getValue() } );
		currentRenderer.outputEncoding = THREE.sRGBEncoding;

		signals.rendererChanged.dispatch( currentRenderer );

	}

	createRenderer();


	// Signals

	signals.editorCleared.add( function () {

		signals.rendererUpdated.dispatch();

	} );

	signals.rendererUpdated.add( function () {

		config.setKey(
			'project/renderer/antialias', antialiasBoolean.getValue(),
		);

	} );

	return container;

}

export { SidebarProjectRenderer };
