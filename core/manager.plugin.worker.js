// Plugin-Manager

const MemoryInABottle_PluginManager = {
	//Plugin Area
	myWorker: undefined,
	taskManager: {
		newTaskID: 0,
		tasks: {},
		activeTasks: 0,
		
		newTask: function(callParam, onresolved = undefined, oncancelled = undefined){
			let myTask = {
				ID: ++this.newTaskID,
				param: callParam,
				callbackResolved: onresolved,
				callbackCancelled: oncancelled,
				returnVal: undefined,
				// 0: pending, -1: cancelled, 1: resolved
				state: 0,
				resolve: function(){
					this.state = 1;
						if(this.callbackResolved !== undefined){this.callbackResolved(this);}
					MemoryInABottle_PluginManager.taskManager.removeTask(this.ID);
				},
				cancel: function(){
					this.state = -1;
						if(this.callbackCancelled !== undefined){this.callbackCancelled(this);}
					MemoryInABottle_PluginManager.taskManager.removeTask(this.ID);
				},
			};
			
			this.tasks[myTask.ID] = myTask;
			this.activeTasks++;
			
			return myTask.ID;
		},
		removeTask: function(taskID){
			let deleted = delete this.tasks.taskID;
				if(deleted){
					this.activeTasks--;
				}
			return deleted;
		},
	},
	
	
	//Worker Area
	inits:{},
	
	//Plugin and Worker Area
	asWorker: (function(){return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;})(),
	plugins: {},
	callQueue: {},

	/**
	 *  Add a plugin.
	 *  
	 *  Call as Worker:
	 *      MemoryInABottle_PluginManager.addPlugin('ogg', undefined, '../Parser/OGGParser/');
	 *  
	 *  Call as non-Worker:
	 *      MemoryInABottle_PluginManager.addPlugin(false, 'ogg', undefined, '../Parser/OGGParser/');
	 *  
	 *  @param [bool] isWorker Add in worker context. Default: true.
	 */
	addPlugin: function(isWorker = true){
		let pluginData = [];
			for(let i=0;i<arguments.length;i++){
				pluginData[i] = arguments[i];
			}
			if(isWorker){
				MemoryInABottle_PluginManager.myWorker.postMessage(['addPlugins', pluginData]);
			}else{
				MemoryInABottle_PluginManager.loadPlugin.apply(undefined, pluginData.slice(1));
			}
	},
	loadPlugin: async function(pluginName, pluginParam, pluginPath = ''){
			if(pluginName !== pluginName.replaceAll(/\\\/\./g, '')){
				return;
			}
		
		let pluginImportPath = pluginPath + pluginName + '.plugin.js';
			if(MemoryInABottle_PluginManager.asWorker){
				importScripts(pluginImportPath);
			}else{
				import(pluginImportPath);
			}
		
		MemoryInABottle_PluginManager.inits[pluginName] = pluginParam;
	},
	registerPlugin: async function(pluginVar){
			if(pluginVar === undefined || pluginVar.type !== 'plugin'){return;}
		
		let pluginList = MemoryInABottle_PluginManager.plugins;
		let pluginID = pluginVar.plugin.id;
		
		pluginList[pluginID] = pluginVar;

			if(pluginList[pluginID].init){
				await pluginList[pluginID].init.apply(undefined, MemoryInABottle_PluginManager.inits[pluginID]);
			}
			if(MemoryInABottle_PluginManager.asWorker){
				postMessage(['loadedPlugin', pluginID, JSON.stringify(pluginVar.plugin)]);
				//MemoryInABottle_PluginManager.plugins[pluginID] = pluginVar;
			}else{
				MemoryInABottle_PluginManager.processQueue(pluginID);
			}
	},
	/**
	 *  @brief Brief
	 *  
	 *  @param [in] pluginID Parameter_Description
	 *  @param [in] functionName Parameter_Description
	 *  @param [in] functionParam Parameter_Description
	 *  @return [obj[int, any]] Returns a status code and the functions return.
	 *  			0: Plugin isn't loaded. Call added to Queue.
	 *  			1: Function called directly.
	 *  			2: Function added to new Task (Returns the TaskID).
	 */
	call: function(pluginID, functionName, ...functionParam){
		let caller = MemoryInABottle_PluginManager.plugins;
		
		// Plugin isn't loaded
			if(!caller.hasOwnProperty(pluginID)){
				// Add to Queue
				
				// Plugin has no Queue
					if(!MemoryInABottle_PluginManager.callQueue.hasOwnProperty(pluginID)){
						MemoryInABottle_PluginManager.callQueue[pluginID] = [];
					}
				
				MemoryInABottle_PluginManager.callQueue[pluginID].push([pluginID, functionName, functionParam]);
				
				return [0, false];
			}
		caller = caller[pluginID];
		
		// Called in worker
			if(MemoryInABottle_PluginManager.asWorker){
				let ret = caller[functionName].apply(caller, ...functionParam);
				postMessage([caller.plugin.id, functionName, ret]);
			}else{
			// Plugin is worker
				if(caller.hasOwnProperty('MemoryInABottle_Plugin_IsWorker')){
					// Call Worker
					let taskID = MemoryInABottle_PluginManager.taskManager.newTask(['call', [pluginID, functionName, functionParam[0]]]);
					return [2, taskID];
				}else{
					// Call directly
					return [1, caller[functionName].apply(caller, ...functionParam)];
				}
			}
	},
	processQueue: function(pluginID){
			if(!MemoryInABottle_PluginManager.callQueue.hasOwnProperty(pluginID)){
				return;
			}
		
		let numberOfTasks = MemoryInABottle_PluginManager.callQueue[pluginID].length;
		
			while(numberOfTasks > 0){
				MemoryInABottle_PluginManager.call.apply(undefined, MemoryInABottle_PluginManager.callQueue[pluginID].shift());
				numberOfTasks--;
			}
	},
	callReturn:function(pluginID, functionName, callback, ...functionParam){
		let ret = this.call(pluginID, functionName, ...functionParam);
		console.log('[CALL-RETURN] Return', ret);
	},
	
	validatePlugin: async function(plugin){
		// Check validity
	},
	
	// Initialisation Function
	init: function(){
		if(MemoryInABottle_PluginManager.asWorker){
			//Used inside Worker
			onmessage = async function(e){
				if(!Array.isArray(e.data)){
					return;
				}
				
				switch(e.data[0]){
					case 'addPlugins':
						let plugList = e.data.slice(1), numOfPlugs = plugList.length;
							for(let i=0;i<numOfPlugs;i++){
								await MemoryInABottle_PluginManager.loadPlugin.apply(undefined, plugList[i]);
							}
						postMessage([
							'write', 'html', 'Plugin-list:<br>' + Object.getOwnPropertyNames(MemoryInABottle_PluginManager.plugins).join('<br>')
						]);
						break;
					case 'call':
						MemoryInABottle_PluginManager.call(...e.data[1]);
						break;

					default:
						console.log('[WORKER] Received Message', e.data[0]);
						console.dir(e.data);
				}
			};
		}else{
			//Used in script
			MemoryInABottle_PluginManager.myWorker = new Worker('../JS_plugins/manager.plugin.worker.js');
			MemoryInABottle_PluginManager.myWorker.onmessage = function(e){
				console.log('[MASTER] Received Message', e.data[0]);
				console.table(e.data);
					if(!Array.isArray(e.data)){
						return;
					}
				
				switch(e.data[0]){
					case 'addListener':
						let eventList = e.data.slice(2), numOfEvents = eventList.length;
						let element = document.getElementById(e.data[1]);
							for(let i=0;i<numOfEvents;i++){
								element[eventList[i]] = function(e){
								
								// Error on transfer of event.
								//   => Move out of worker
								//   => Move PluginManager out of worker.
									//MemoryInABottle_PluginManager_Worker.postMessage(['callPlugin', 'dropzone', [eventList[i], e]]);
								};
							}
						break;

					case 'loadedPlugin':
						let plugin = JSON.parse(e.data[2]);
						DOMSupportedFileTypes.innerHTML += '<li>'+plugin.name+'</li>';
						plugin.MemoryInABottle_Plugin_IsWorker = true;
						
						MemoryInABottle_PluginManager.plugins[plugin.id] = plugin;
						MemoryInABottle_PluginManager.processQueue(plugin.id);
						break;
					case 'dom':
						break;
					
					default:
				}
			};
		}
	},
};

MemoryInABottle_PluginManager.init();
