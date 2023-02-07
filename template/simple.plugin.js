// Plugin - Name

const MemoryInABottle_Category_SubCategory_Identifier = {
  type: 'plugin',
  plugin: {
    // Unique name
    fileName: '',
    // Name descriptor (friendly name)
    name: '',
    type: '',
    category: '',
    description: ''
    // List of public function names (excluding miabPlugin-specifics),
    //   if entry isArray => [name, ...description]
    //   if entry isObject => property: value (required: name)
    functions: [
      //{name: '', type: '', parameter: {}, description: ''},
    ],
    // List of public property names (excluding miabPlugin-specifics),
    //   if entry isObject => property: value (required: name)
    properties: [
      //{name: '', type: '', value: ''},
    ],
    // List of requirements.
    requirements: [
      //{type: 'file', path: 'librarypath', version: '3.6'},
    ],
    register: function(){
      if(MemoryInABottle_PluginManager){
        MemoryInABottle_PluginManager.registerPlugin(MemoryInABottle_Category_SubCategory_Identifier);
      }
    },
  },
};
MemoryInABottle_Category_SubCategory_Identifier.plugin.register();
