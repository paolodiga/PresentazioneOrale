import * as THREE from '../build/three.module.js';

import { TransformControls } from '../jsm/controls/TransformControls.js';
import { UIPanel } from './libs/ui.js';
import { EditorControls } from './EditorControls.js';
import { ViewHelper } from './Viewport.ViewHelper.js';
import { VR } from './Viewport.VR.js';
import { SetPositionCommand } from './commands/SetPositionCommand.js';
import { SetRotationCommand } from './commands/SetRotationCommand.js';
import { SetScaleCommand } from './commands/SetScaleCommand.js';

function Viewport( editor ) {
	let signals = editor.signals;

	let container = new UIPanel();
	container.setId( 'viewport' );
	container.setPosition( 'absolute' );

	//

	let renderer = null;
	let pmremGenerator = null;
	let pmremTexture = null;

	let camera = editor.camera;
	let scene = editor.scene;
	let sceneHelpers = editor.sceneHelpers;
	let showSceneHelpers = true;

	let objects = [];

	// helpers

	let grid = new THREE.Group();

	let grid1 = new THREE.GridHelper( 30, 30, 0x888888 );
	grid1.material.color.setHex( 0x888888 );
	grid1.material.vertexColors = false;
	grid.add( grid1 );

	let grid2 = new THREE.GridHelper( 30, 6, 0x222222 );
	grid2.material.color.setHex( 0x222222 );
	grid2.material.depthFunc = THREE.AlwaysDepth;
	grid2.material.vertexColors = false;
	grid.add( grid2 );

	let viewHelper = new ViewHelper( camera, container );
	let vr = new VR( editor );

	//

	let box = new THREE.Box3();

	let selectionBox = new THREE.BoxHelper();
	selectionBox.material.depthTest = false;
	selectionBox.material.transparent = true;
	selectionBox.visible = false;
	sceneHelpers.add( selectionBox );

	let objectPositionOnDown = null;
	let objectRotationOnDown = null;
	let objectScaleOnDown = null;

	let transformControls = new TransformControls( camera, container.dom );
	transformControls.addEventListener( 'change', function () {
		let object = transformControls.object;

		if ( object !== undefined ) {
			selectionBox.setFromObject( object );

			let helper = editor.helpers[ object.id ];

			if ( helper !== undefined && helper.isSkeletonHelper !== true ) {
				helper.update();
			}
			signals.refreshSidebarObject3D.dispatch( object );
		}
		render();
	} );
	transformControls.addEventListener( 'mouseDown', function () {
		let object = transformControls.object;

		objectPositionOnDown = object.position.clone();
		objectRotationOnDown = object.rotation.clone();
		objectScaleOnDown = object.scale.clone();

		controls.enabled = false;
	} );
	transformControls.addEventListener( 'mouseUp', function () {
		let object = transformControls.object;
		if ( object !== undefined ) {
			switch ( transformControls.getMode() ) {
				case 'translate':
					if ( ! objectPositionOnDown.equals( object.position ) ) {
						editor.execute( new SetPositionCommand( editor, object, object.position, objectPositionOnDown ) );
					}
					break;

				case 'rotate':
					if ( ! objectRotationOnDown.equals( object.rotation ) ) {
						editor.execute( new SetRotationCommand( editor, object, object.rotation, objectRotationOnDown ) );
					}
					break;

				case 'scale':
					if ( ! objectScaleOnDown.equals( object.scale ) ) {
						editor.execute( new SetScaleCommand( editor, object, object.scale, objectScaleOnDown ) );
					}
					break;
			}
		}
		controls.enabled = true;
	} );

	sceneHelpers.add( transformControls );

	// object picking

	let raycaster = new THREE.Raycaster();
	let mouse = new THREE.Vector2();

	// events

	function updateAspectRatio() {
		camera.aspect = container.dom.offsetWidth / container.dom.offsetHeight;
		camera.updateProjectionMatrix();
	}

	function getIntersects( point, objects ) {
		mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );

		raycaster.setFromCamera( mouse, camera );

		return raycaster.intersectObjects( objects );
	}

	let onDownPosition = new THREE.Vector2();
	let onUpPosition = new THREE.Vector2();
	let onDoubleClickPosition = new THREE.Vector2();

	function getMousePosition( dom, x, y ) {
		let rect = dom.getBoundingClientRect();
		return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];
	}

	function handleClick() {
		if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) {
			let intersects = getIntersects( onUpPosition, objects );

			if ( intersects.length > 0 ) {
				let object = intersects[ 0 ].object;
				if ( object.userData.object !== undefined ) {

					// helper

					editor.select( object.userData.object );
				} else {
					editor.select( object );
				}
			} else {
				editor.select( null );
			}
			render();
		}
	}

	function onMouseDown( event ) {
		// event.preventDefault();

		let array = getMousePosition( container.dom, event.clientX, event.clientY );
		onDownPosition.fromArray( array );

		document.addEventListener( 'mouseup', onMouseUp, false );
	}

	function onMouseUp( event ) {
		let array = getMousePosition( container.dom, event.clientX, event.clientY );
		onUpPosition.fromArray( array );

		handleClick();

		document.removeEventListener( 'mouseup', onMouseUp, false );
	}

	function onTouchStart( event ) {
		let touch = event.changedTouches[ 0 ];

		let array = getMousePosition( container.dom, touch.clientX, touch.clientY );
		onDownPosition.fromArray( array );

		document.addEventListener( 'touchend', onTouchEnd, false );
	}

	function onTouchEnd( event ) {
		let touch = event.changedTouches[ 0 ];

		let array = getMousePosition( container.dom, touch.clientX, touch.clientY );
		onUpPosition.fromArray( array );

		handleClick();

		document.removeEventListener( 'touchend', onTouchEnd, false );
	}

	function onDoubleClick( event ) {
		let array = getMousePosition( container.dom, event.clientX, event.clientY );
		onDoubleClickPosition.fromArray( array );

		let intersects = getIntersects( onDoubleClickPosition, objects );

		if ( intersects.length > 0 ) {
			let intersect = intersects[ 0 ];
			signals.objectFocused.dispatch( intersect.object );
		}
	}

	container.dom.addEventListener( 'mousedown', onMouseDown, false );
	container.dom.addEventListener( 'touchstart', onTouchStart, false );
	container.dom.addEventListener( 'dblclick', onDoubleClick, false );

	// controls need to be added *after* main logic,
	// otherwise controls.enabled doesn't work.

	let controls = new EditorControls( camera, container.dom );
	controls.addEventListener( 'change', function () {
		signals.cameraChanged.dispatch( camera );
		signals.refreshSidebarObject3D.dispatch( camera );
	} );
	viewHelper.controls = controls;

	// signals

	signals.editorCleared.add( function () {
		controls.center.set( 0, 0, 0 );
		render();
	} );

	signals.transformModeChanged.add( function ( mode ) {
		transformControls.setMode( mode );
	} );

	signals.snapChanged.add( function ( dist ) {
		transformControls.setTranslationSnap( dist );
	} );

	signals.spaceChanged.add( function ( space ) {
		transformControls.setSpace( space );
	} );

	signals.rendererUpdated.add( function () {
		scene.traverse( function ( child ) {
			if ( child.material !== undefined ) {
				child.material.needsUpdate = true;
			}
		} );
		render();
	} );

	signals.rendererChanged.add( function ( newRenderer ) {
		if ( renderer !== null ) {
			renderer.setAnimationLoop( null );
			renderer.dispose();
			pmremGenerator.dispose();
			pmremTexture = null;

			container.dom.removeChild( renderer.domElement );
		}

		renderer = newRenderer;

		renderer.setAnimationLoop( animate );
		renderer.setClearColor( 0xaaaaaa );

		if ( window.matchMedia ) {
			let mediaQuery = window.matchMedia( '(prefers-color-scheme: dark)' );
            // MediaQueryList.addListener( function ( event ) {
            mediaQuery.addListener( function ( event ) {
				renderer.setClearColor( event.matches ? 0x333333 : 0xaaaaaa );
				updateGridColors( grid1, grid2, event.matches ? [ 0x222222, 0x888888 ] : [ 0x888888, 0x282828 ] );

				render();
			} );
			renderer.setClearColor( mediaQuery.matches ? 0x333333 : 0xaaaaaa );
			updateGridColors( grid1, grid2, mediaQuery.matches ? [ 0x222222, 0x888888 ] : [ 0x888888, 0x282828 ] );
		}
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight );

		pmremGenerator = new THREE.PMREMGenerator( renderer );
		pmremGenerator.compileEquirectangularShader();

		container.dom.appendChild( renderer.domElement );

		render();
	} );

	signals.sceneGraphChanged.add( function () {
		render();
	} );

	signals.cameraChanged.add( function () {
		render();
	} );

	signals.objectSelected.add( function ( object ) {
		selectionBox.visible = false;
		transformControls.detach();
		if ( object !== null && object !== scene && object !== camera ) {
			box.setFromObject( object );
			if ( box.isEmpty() === false ) {
				selectionBox.setFromObject( object );
				selectionBox.visible = true;
			}
			transformControls.attach( object );
		}
		render();
	} );

	signals.objectFocused.add( function ( object ) {
		controls.focus( object );
	} );

	signals.geometryChanged.add( function ( object ) {
		if ( object !== undefined ) {
			selectionBox.setFromObject( object );
		}
		render();
	} );

	signals.objectAdded.add( function ( object ) {
		object.traverse( function ( child ) {
			objects.push( child );
		} );
	} );

	signals.objectChanged.add( function ( object ) {
		if ( editor.selected === object ) {
			selectionBox.setFromObject( object );
		}
		if ( object.isPerspectiveCamera ) {
			object.updateProjectionMatrix();
		}
		if ( editor.helpers[ object.id ] !== undefined ) {
			editor.helpers[ object.id ].update();
		}
		render();
	} );

	signals.objectRemoved.add( function ( object ) {
		controls.enabled = true; // see #14180
		if ( object === transformControls.object ) {
			transformControls.detach();
		}

		object.traverse( function ( child ) {
			objects.splice( objects.indexOf( child ), 1 );
		} );
	} );

	signals.helperAdded.add( function ( object ) {
		let picker = object.getObjectByName( 'picker' );

		if ( picker !== undefined ) {
			objects.push( picker );
		}
	} );

	signals.helperRemoved.add( function ( object ) {
		let picker = object.getObjectByName( 'picker' );

		if ( picker !== undefined ) {
			objects.splice( objects.indexOf( picker ), 1 );
		}
	} );

	signals.materialChanged.add( function () {
		render();
	} );

	signals.animationStopped.add( function () {
		render();
	} );

	// background

	signals.sceneBackgroundChanged.add( function ( backgroundType, backgroundColor ) {
		pmremTexture = null;

		switch ( backgroundType ) {
			case 'None':
				scene.background = null;
				break;

			case 'Color':
				scene.background = new THREE.Color( backgroundColor );
				break;
		}
		render();
	} );

	//

	signals.windowResize.add( function () {
		updateAspectRatio();
		renderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight );
		render();
	} );

	signals.showGridChanged.add( function ( showGrid ) {
		grid.visible = showGrid;
		render();
	} );

	signals.showHelpersChanged.add( function ( showHelpers ) {
		showSceneHelpers = showHelpers;
		transformControls.enabled = showHelpers;
		render();
	} );
	signals.cameraResetted.add( updateAspectRatio );

	// animations

	let clock = new THREE.Clock(); // only used for animations

	function animate() {
		let mixer = editor.mixer;
		let delta = clock.getDelta();
		let needsUpdate = false;

		if ( mixer.stats.actions.inUse > 0 ) {
			mixer.update( delta );
			needsUpdate = true;
		}
		if ( viewHelper.animating === true ) {
			viewHelper.update( delta );
			needsUpdate = true;
		}
		if ( vr.currentSession !== null ) {
			needsUpdate = true;
		}
		if ( needsUpdate === true ) render();
	}

	//

	let startTime = 0;
	let endTime = 0;

	function render() {
		startTime = performance.now();

		// Adding/removing grid to scene so materials with depthWrite false
		// don't render under the grid.

		scene.add( grid );
		renderer.setViewport( 0, 0, container.dom.offsetWidth, container.dom.offsetHeight );
		renderer.render( scene, editor.viewportCamera );
		scene.remove( grid );

		if ( camera === editor.viewportCamera ) {
			renderer.autoClear = false;
			if ( showSceneHelpers === true ) renderer.render( sceneHelpers, camera );
			if ( vr.currentSession === null ) viewHelper.render( renderer );
			renderer.autoClear = true;
		}
		endTime = performance.now();
		editor.signals.sceneRendered.dispatch( endTime - startTime );
	}
	return container;
}

function updateGridColors( grid1, grid2, colors ) {
	grid1.material.color.setHex( colors[ 0 ] );
	grid2.material.color.setHex( colors[ 1 ] );
}

export { Viewport };
