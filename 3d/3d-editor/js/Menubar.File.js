import * as THREE from '../build/three.module.js';

import { zipSync, strToU8 } from '../jsm/libs/fflate.module.min.js';

import { UIPanel, UIRow, UIHorizontalRule } from './libs/ui.js';

function MenubarFile( editor ) {
    let option;

	function parseNumber( key, value ) {
		let precision = config.getKey( 'exportPrecision' );

		return typeof value === 'number' ? parseFloat( value.toFixed( precision ) ) : value;
	}

	//

	let config = editor.config;
	let strings = editor.strings;

	let container = new UIPanel();
	container.setClass( 'menu' );

	let title = new UIPanel();
	title.setClass( 'title' );
	title.setTextContent( strings.getKey( 'menubar/file' ) );
	container.add( title );

	let options = new UIPanel();
	options.setClass( 'options' );
	container.add( options );

	// New

    option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( strings.getKey( 'menubar/file/new' ) );
	option.onClick( function () {
		if ( confirm( 'Any unsaved data will be lost. Are you sure?' ) ) {
			editor.clear();
		}
	} );
	options.add( option );

	//

	options.add( new UIHorizontalRule() );

	// Import

	let form = document.createElement( 'form' );
	form.style.display = 'none';
	document.body.appendChild( form );

	let fileInput = document.createElement( 'input' );
	fileInput.multiple = true;
	fileInput.type = 'file';
	fileInput.addEventListener( 'change', function () {
		editor.loader.loadFiles( fileInput.files );
		form.reset();
	} );
	form.appendChild( fileInput );

	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( strings.getKey( 'menubar/file/import' ) );
	option.onClick( function () {
		fileInput.click();
	} );
	options.add( option );

	//

	options.add( new UIHorizontalRule() );

	// Publish

	option = new UIRow();
	option.setClass( 'option' );
	option.setTextContent( strings.getKey( 'menubar/file/publish' ) );
	option.onClick( function () {
		let output = editor.toJSON();
		output.metadata.type = 'app';
		delete output.history;

		output = JSON.stringify( output, parseNumber, '\t' );
		output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );
		console.log(output);

		let blob = new Blob([output], {type : 'application/json'});
		save ( blob, ( title !== '' ? title : 'app' ) + '.json');
	} );

	options.add( option );

	//

	let link = document.createElement( 'a' );
	function save( blob, filename ) {
		if ( link.href ) {
			URL.revokeObjectURL( link.href );
		}
		link.href = URL.createObjectURL( blob );
		link.download = filename || 'data.json';
		link.dispatchEvent( new MouseEvent( 'click' ) );
	}

	function saveArrayBuffer( buffer, filename ) {
		save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
	}

	function saveString( text, filename ) {
		save( new Blob( [ text ], { type: 'text/plain' } ), filename );
	}

	function getAnimations( scene ) {
		let animations = [];
		scene.traverse( function ( object ) {
			animations.push( ... object.animations );
		} );
		return animations;
	}
	return container;
}

export { MenubarFile };