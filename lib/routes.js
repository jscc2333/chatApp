'use strict';

var configRoutes,	
	crud = require('./crud.js'),
	chat = require('./chat.js'),
	makeMongoId = mongodb.ObjectID,
	
configRoutes = function(app,server){
	app.get('/',function(request,response){
	// response.send(__dirname);
	response.redirect('/spa.html');
	});

	app.all('/:obj_type/*?',function(request,response,next){
		response.contentType('json');
		next();
	});

	app.get('/:obj_type/list',function(request,response){
		crud.read(
			request.params.obj_type,
			{},{},
			function(map_list){
				response.send(map_list);
			});
		}).post('/:obj_type/create/:id([0-9]+)',function(request,response){
			crud.construct(
				request.params.obj_type,
				request.body,
				function(result_map){
					response.send(result_map);
				}
			);
		}).get('/:obj_type/read/:id([0-9]+)',function(request,response){
			crud.read(
				request.params.obj_type,
				{_id :makeMongoId(request.params.id)},
				{},
				function(map_list){
					response.send(map_list);
				}
			);
		}).post('/:obj_type/update/:id([0-9]+)',function(request,response){
			crud.update(
				request.params.obj_type,
				{_id:makeMongoId(request.params.id)},
				request.body,
				function(result_map){
					response.send(result_map);
				}
			);			
		}).get('/:obj_type/delete/:id([0-9]+)',function(request,response){
			crud.destroy(
				request.params.obj_type,
				{_id:makeMongoId(request.params.id)},
				function(result_map){
					response.send(result_map);
				}
			);
		});
	chat.connect(server);
};

module.exports =  {
	configRoutes : configRoutes
};

dbHandle.open(function(){
	console.log("----connected to MongoDB----");
});

