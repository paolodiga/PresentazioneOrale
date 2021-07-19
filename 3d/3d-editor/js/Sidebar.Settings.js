import { UIPanel, UIRow, UISelect, UISpan, UIText } from './libs/ui.js';

import { SidebarSettingsShortcuts } from './Sidebar.Settings.Shortcuts.js';

function SidebarSettings( editor ) {

	let config = editor.config;
	let strings = editor.strings;

	let container = new UISpan();

	let settings = new UIPanel();
	settings.setBorderTop( '0' );
	settings.setPaddingTop( '20px' );
	container.add( settings );

	// language

	let options = {
        it: 'Italian',
		en: 'English'
	};

	let languageRow = new UIRow();
	let language = new UISelect().setWidth( '150px' );
	language.setOptions( options );

	if ( config.getKey( 'language' ) !== undefined ) {

		language.setValue( config.getKey( 'language' ) );

	}

	language.onChange( function () {

		let value = this.getValue();

		editor.config.setKey( 'language', value );

	} );

	languageRow.add( new UIText( strings.getKey( 'sidebar/settings/language' ) ).setWidth( '90px' ) );
	languageRow.add( language );

	settings.add( languageRow );

	container.add( new SidebarSettingsShortcuts( editor ) );

	return container;

}

export { SidebarSettings };
