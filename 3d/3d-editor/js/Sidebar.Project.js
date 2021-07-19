import { UIPanel, UIRow, UIInput, UIText, UISpan } from './libs/ui.js';

import { SidebarProjectRenderer } from './Sidebar.Project.Renderer.js';
import { SidebarProjectViewport } from './Sidebar.Project.Viewport.js';
import { SidebarProjectHistory } from './Sidebar.Project.History.js';

function SidebarProject( editor ) {

	let config = editor.config;
	let strings = editor.strings;

	let container = new UISpan();

	let settings = new UIPanel();
	settings.setBorderTop( '0' );
	settings.setPaddingTop( '20px' );
	container.add( settings );

	// Title

	let titleRow = new UIRow();
	let title = new UIInput( config.getKey( 'project/title' ) ).setLeft( '100px' ).setWidth( '150px' ).onChange( function () {

		config.setKey( 'project/title', this.getValue() );

	} );

	titleRow.add( new UIText( strings.getKey( 'sidebar/project/title' ) ).setWidth( '90px' ) );
	titleRow.add( title );

	settings.add( titleRow );

	container.add( new SidebarProjectRenderer( editor ) );
    container.add( new SidebarProjectViewport( editor ) );
    container.add( new SidebarProjectHistory( editor ) );

	return container;

}

export { SidebarProject };
