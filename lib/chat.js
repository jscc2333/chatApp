var
	emitUserList,signIn,chatObj,
	socket = require('socket.io'),
	crud = require('./crud'),

	makeMongoId= crud.makeMongoId,
	chatterMap = {};

emitUserList = function(io){
	crud.read(
		'user',
		{is_online : true},
		{},
		function(result_list){
			io.of('/chat')
				.emit('listchange',result_list);
		}
	);
};

signIn = function(io,user_map,socket){
	crud.update(
		'user',
		{'_id':user_map._id},
		{is_online:true},
		function(result_map){
			emitUserList(io);
			user_map.is_online = true;
			socket.emit('userupdate',user_map);
		}
	);
	chatterMap[user_map._id] = socket;
	socket.user_id = user_map._id;
};

signOut = function(io,user_id){
	crud.update(
		'user',
		{'_id':user_id},
		{is_online:false},
		function(result_list){
			emitUserList(io);
		}
	);
	delete chatterMap[user_id];
};

chatObj = {
	connect: function(server){
		var io = socket.listen(server);

		io.set('blacklist',[])
		.of('/chat')
		.on('connection',function(socket){
			socket.on('addUser',function(user_map){
				
				if(chatterMap[user_map._id]){

				}
				crud.read(
					'user',
					{name:user_map.name},
					{},
					function(result_list){
						console.log(result_list);
						var 
							result_map,
							error_msg,
							cid = user_map.cid;

						delete user_map.cid;
						if(result_list.length > 0){

							if(chatterMap[result_list[0]._id]){
								error_msg = result_list[0].name + ' is online,please don\'t login again';
								socket.emit('loginError',error_msg);
								return;
							}else if(result_list[0].password !== user_map.password){
								error_msg = result_list[0].name + ' has input a wrong password';
								console.log('i am here');
								socket.emit('loginError',error_msg);
								return;
							}
							result_map = result_list[0];
							result_map.cid = cid;
							signIn(io,result_map,socket);
						}
						else{
							user_map.is_online = true;
							crud.construct(
								'user',
								user_map,
								function(result_list){
									console.log(result_list);
									result_map = result_list.ops[0];
									result_map.cid = cid;
									chatterMap[result_map._id] = socket;
									socket.user_id = result_map._id;
									socket.emit('userupdate',result_map);
									emitUserList(io);
								}
							);
						}
					}
				);
			}).on('updatechat',function(chat_map){
				if(chatterMap.hasOwnProperty(chat_map.dest_id)){
					chatterMap[chat_map.dest_id].emit('updatechat',chat_map);
				}
				else{
					socket.emit('updatechat',{
						sender_id : chat_map.sender_id,
						msg_text : chat_map.dest_name +' is offline'
					});
				}
			}).on('leavechat',function(){
				console.log('user %s logged out',socket.user_id);
				signOut(io,socket.user_id);
			}).on('disconnect',function(){
				console.log('user %s closed browser',socket.user_id);
				signOut(io,socket.user_id);
			}).on('updateavatar',function(avtr_map){
				crud.update(
					'user',
					{'_id':makeMongoId(avtr_map.person_id)},
					{css_map:avtr_map.css_map},
					function(result_list){
						emitUserList(io);
					}
				);
			});
		});

		return io;
	}
};

module.exports = chatObj;