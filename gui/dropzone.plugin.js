// Drop-Zone
// TODO: Add possibility to pass dragEnter, dragOver and dragLeave functions. JSON.stringify?
//			let addition = Function("a", "b", "return a + b;"); => addition(5, 3) -> 8

const MemoryInABottle_GUI_DropZone = {
	type: 'plugin',
	plugin: {
		// Unique name
		id: 'dropzone',
		// Plugin path
		fileName: 'dropzone.plugin.js',
		// Name descriptor (friendly name)
		name: 'Drop-Zone',
		type: 'drag-and-drop',
		category: 'gui',
		description: 'A file-drop area.',
		// List of public function names (excluding miabPlugin-specifics),
		//   if entry isArray => [name, ...description]
		//   if entry isObject => property: value (required: name)
		functions: [
			{name: 'init', type: 'void', parameter: {dropZoneID: '#ID of the drop-zone.', callback: 'Function called after files are dropped.'}, description: 'Initialises the drop zone.'},
			{name: 'register', type: 'void', description: 'Registers the plugin for the pluginManager.'},
		],
		// List of public property names (excluding miabPlugin-specifics),
		//   if entry isObject => property: value (required: name)
		properties: [
			{name: 'dropZone', type: 'domElement', description: 'Drop-Zone DOM Element.'},
		],
		// List of requirements.
		requirements: [
			//{type: 'file', path: 'librarypath', version: '3.6'},
		],
		register: function(){
			if(MemoryInABottle_PluginManager){
				MemoryInABottle_PluginManager.registerPlugin(MemoryInABottle_GUI_DropZone);
			}
		},
	},
	
	dropZones: [],

	addZones: async function(){
		for(let i=0;i<arguments.length;i++){
			this.addZone(arguments[i][0], arguments[i][1]);
		}
	},
	addZone: async function(dropZoneID, onDrop = undefined, onDragEnter = undefined, onDragOver = undefined, onDragLeave = undefined){
		let myThis = document.getElementById(dropZoneID);
		this.dropZones.push(myThis);

		myThis.ondragenter=function(e){
			e.preventDefault();e.stopPropagation();
				if(onDragEnter !== undefined){
					onDragEnter(e);
				}
		};
		myThis.ondragleave=function(e){
			e.preventDefault();e.stopPropagation();
				if(onDragLeave !== undefined){
					onDragLeave(e);
				}
		};
		myThis.ondragover=function(e){
			e.preventDefault();e.stopPropagation();
				if(onDragOver !== undefined){
					onDragOver(e);
				}
		};
		myThis.ondrop=function(e){
			e.preventDefault();e.stopPropagation();
				if(onDrop !== undefined){
					onDrop(e);
				}
		};
	},
};
MemoryInABottle_GUI_DropZone.plugin.register();
