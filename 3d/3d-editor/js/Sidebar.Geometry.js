import * as THREE from '../build/three.module.js';

import { UIPanel, UIRow, UIText, UIInput, UIButton, UISpan } from './libs/ui.js';

import { SetGeometryValueCommand } from './commands/SetGeometryValueCommand.js';

import { SidebarGeometryBufferGeometry } from './Sidebar.Geometry.BufferGeometry.js';
import { SidebarGeometryModifiers } from './Sidebar.Geometry.Modifiers.js';

import { VertexNormalsHelper } from '../jsm/helpers/VertexNormalsHelper.js';

function SidebarGeometry( editor ) {

	let strings = editor.strings;

	let signals = editor.signals;

	let container = new UIPanel();
	container.setBorderTop( '0' );
	container.setDisplay( 'none' );
	container.setPaddingTop( '20px' );

	let currentGeometryType = null;

	// type

	let geometryTypeRow = new UIRow();
	let geometryType = new UIText();

	geometryTypeRow.add( new UIText( strings.getKey( 'sidebar/geometry/type' ) ).setWidth( '90px' ) );
	geometryTypeRow.add( geometryType );

	container.add( geometryTypeRow );

	// uuid

	let geometryUUIDRow = new UIRow();
	let geometryUUID = new UIInput().setWidth( '102px' ).setFontSize( '12px' ).setDisabled( true );
	let geometryUUIDRenew = new UIButton( strings.getKey( 'sidebar/geometry/new' ) ).setMarginLeft( '7px' ).onClick( function () {

		geometryUUID.setValue( THREE.MathUtils.generateUUID() );

		editor.execute( new SetGeometryValueCommand( editor, editor.selected, 'uuid', geometryUUID.getValue() ) );

	} );

	geometryUUIDRow.add( new UIText( strings.getKey( 'sidebar/geometry/uuid' ) ).setWidth( '90px' ) );
	geometryUUIDRow.add( geometryUUID );
	geometryUUIDRow.add( geometryUUIDRenew );

	container.add( geometryUUIDRow );

	// name

	let geometryNameRow = new UIRow();
	let geometryName = new UIInput().setWidth( '150px' ).setFontSize( '12px' ).onChange( function () {

		editor.execute( new SetGeometryValueCommand( editor, editor.selected, 'name', geometryName.getValue() ) );

	} );

	geometryNameRow.add( new UIText( strings.getKey( 'sidebar/geometry/name' ) ).setWidth( '90px' ) );
	geometryNameRow.add( geometryName );

	container.add( geometryNameRow );

	// parameters

	let parameters = new UISpan();
	container.add( parameters );

	// buffergeometry

	container.add( new SidebarGeometryBufferGeometry( editor ) );

	// size

	let geometryBoundingSphere = new UIText();

	container.add( new UIText( strings.getKey( 'sidebar/geometry/bounds' ) ).setWidth( '90px' ) );
	container.add( geometryBoundingSphere );

	// Helpers

	let helpersRow = new UIRow().setMarginTop( '16px' ).setPaddingLeft( '90px' );
	container.add( helpersRow );

	let vertexNormalsButton = new UIButton( strings.getKey( 'sidebar/geometry/show_vertex_normals' ) );
	vertexNormalsButton.onClick( function () {

		let object = editor.selected;

		if ( editor.helpers[ object.id ] === undefined ) {

			let helper = new VertexNormalsHelper( object );
			editor.addHelper( object, helper );

		} else {

			editor.removeHelper( object );

		}

		signals.sceneGraphChanged.dispatch();

	} );
	helpersRow.add( vertexNormalsButton );

	async function build() {

		let object = editor.selected;

		if ( object && object.geometry ) {

			let geometry = object.geometry;

			container.setDisplay( 'block' );

			geometryType.setValue( geometry.type );

			geometryUUID.setValue( geometry.uuid );
			geometryName.setValue( geometry.name );

			//

			if ( currentGeometryType !== geometry.type ) {

				parameters.clear();

				if ( geometry.type === 'BufferGeometry' ) {

					parameters.add( new SidebarGeometryModifiers( editor, object ) );

				} else {

					let { GeometryParametersPanel } = await import( `./Sidebar.Geometry.${ geometry.type }.js` );

					parameters.add( new GeometryParametersPanel( editor, object ) );

				}

				currentGeometryType = geometry.type;

			}

			if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

			geometryBoundingSphere.setValue( Math.floor( geometry.boundingSphere.radius * 1000 ) / 1000 );

		} else {

			container.setDisplay( 'none' );

		}

	}

	signals.objectSelected.add( function () {

		currentGeometryType = null;

		build();

	} );

	signals.geometryChanged.add( build );

	return container;

}

export { SidebarGeometry };
