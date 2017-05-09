/*
spa.model.js
Model module
 */

spaModel = (function(){
	'use strict';

	var 
		configMap = {anon_id : 'a0'},
		stateMap = {
			anon_user : null,
			cid_serial : 0,
			people_cid_map : {},
			people_db : TAFFY(),
			user : null,
			error: {},
			is_connected : false
		},
		isFakeData = false,
		personProto,makePerson,makeCid,clearPeopleDb,loginError,
		completeLogin,people,chat,removePerson,initModule;

		personProto = {
			get_is_user : function(){
				return this.cid === stateMap.user.cid; 
			},
			get_is_anon : function(){
				return this.cid === stateMap.anon_user.cid;
			}
		};

		makePerson = function(person_map){
			var
				person,
				cid = person_map.cid,
				css_map = person_map.css_map,
				id = person_map.id,
				name = person_map.name,
				password = person_map.password;
			if( cid === undefined || !name){
				throw 'client id and name required';
			}

			person = Object.create(personProto);
			
			person.cid = cid;
			person.name = name;
			person.password = password;
			person.css_map = css_map;

			if(id){
				person.id = id;
			}
			stateMap.people_cid_map[cid] = person;
			stateMap.people_db.insert(person);
			return person;
		};

		removePerson = function(person){
			if(!person){
				return false;
			}
			if(person.id === configMap.anon_id){
				return false;
			}
			stateMap.people_db({cid : person.cid}).remove();

			if(person.cid){
				delete stateMap.people_cid_map[person.cid];
			}
			return true;
		};

		makeCid = function(){
			return 'c'+String(stateMap.cid_serial++);
		};

		

		clearPeopleDb = function(){
			var user = stateMap.user;
			stateMap.people_db = TAFFY();
			stateMap.people_cid_map = {};
			if(user){
				stateMap.people_db.insert(user);
				stateMap.people_cid_map[user.cid] = user;
			}
		};

		completeLogin = function(user_list){
			var user_map = user_list[0];
			delete stateMap.people_cid_map[user_map.cid];

			stateMap.user.cid = user_map._id;
			stateMap.user.id = user_map._id;
			stateMap.user.css_map = user_map.css_map;
			stateMap.people_cid_map[user_map._id] = stateMap.user;
			chat.join();
			$.gevent.publish('spa-login',[stateMap.user]);
		};

		loginError = function(error_msg){
			// console.log(error_msg);
			// alert(error_msg[0]);
			console.log(error_msg);
			stateMap.error.msg = error_msg[0];
			console.log(stateMap.error);
			$.gevent.publish('spa-logerror',[stateMap.error]);

		};

		people = (function(){
			var get_by_cid,get_db,get_user,login,logout;

			get_by_cid = function(cid){
				return stateMap.people_cid_map[cid];
			};
			get_db = function(){
				return stateMap.people_db;
			};
			get_user = function(){
				return stateMap.user;
			};
			login = function(name,password){
				var sio = isFakeData?spaFake.mockSio:spaData.getSio();
				console.log(password);
				stateMap.user = makePerson({
					cid : makeCid(),
					css_map : {
						top:Math.floor(Math.random()*350),
						left:Math.floor(Math.random()*580),
						"background-color":spaUtilb.getRandRgb()
					},
					name : name,
					password : password
				});
				sio.on('userupdate',completeLogin);
				sio.on('loginError',loginError);
				sio.emit('addUser',{
					cid : stateMap.user.cid,
					css_map : stateMap.user.css_map,
					name : stateMap.user.name,
					password : stateMap.user.password
				});
			};

			logout = function(){
				var  user = stateMap.user;

				chat._leave();
				stateMap.user = stateMap.anon_user;
				clearPeopleDb();

				$.gevent.publish('spa-logout',[user]);
			};

			return {
				get_by_cid : get_by_cid,
				get_db : get_db,
				get_user : get_user,
				login : login,
				logout : logout
			};
		})();

		chat = (function(){
			var
				_publish_listchange,_publish_updatechat,
				_update_list,_leave_chat,get_chatee,join_chat,
				send_msg,set_chatee,update_avatar,chatee = null;

				_update_list = function(arg_list){
					var i,person_map,make_person_map,person,
					 	people_list = arg_list[0],
					 	is_chatee_online = false;
					clearPeopleDb();

					PERSON:
					for(i = 0; i < people_list.length; i++){
						person_map = people_list[i];
						if(!person_map.name){
							continue PERSON;
						}
						if(stateMap.user && stateMap.user.id === person_map._id ){
							stateMap.user.css_map = person_map.css_map;
							continue PERSON;
						}

						make_person_map = {
							cid : person_map._id,
							css_map : person_map.css_map,
							id : person_map._id,
							name : person_map.name
						};
						person = makePerson(make_person_map);
						if(chatee && chatee.id === make_person_map.id){
							is_chatee_online = true;
							chatee = person;
						}
						makePerson(make_person_map);
					}
					stateMap.people_db.sort('name');

					if(!(chatee && is_chatee_online)){
						set_chatee('');
					}
				};

				_publish_listchange = function(arg_list){
					_update_list(arg_list);
					$.gevent.publish('spa-listchange',[ arg_list ]);
				};

				_publish_updatechat = function(arg_list){
					var msg_map = arg_list[0];

					if(!chatee){
						set_chatee(msg_map.sender_id);
					}
					else if(msg_map.sender_id !== stateMap.user.id && msg_map.sender_id !== chatee.id){
						set_chatee(msg_map.sender_id);
					}

					$.gevent.publish('spa-updatechat',[msg_map]);
				};

				_leave_chat = function(){
					var sio = isFakeData?spaFake.mockSio : spaData.getSio();
					chatee = null;

					stateMap.is_connected = false;
					if(sio){
						sio.emit('leavechat');
					}
				};

				get_chatee = function(){
					return chatee;
				};

				join_chat = function(){
					var sio;
					if(stateMap.is_connected){
						return false;
					}

					if(stateMap.user.get_is_anon()){
						return false;
					}

					sio = isFakeData?spaFake.mockSio : spaData.getSio();
					sio.on('listchange',_publish_listchange);
					sio.on('updatechat',_publish_updatechat);
					stateMap.is_connected = false;
					return true;
				};

				send_msg = function(msg_text){
					var msg_map,
						sio = isFakeData? spaFake.mockSio : spaData.getSio();
					if(!sio){
						return false;
					}
					if(!(stateMap.user && chatee)){
						return false;
					}

					msg_map = {
						dest_id : chatee.id,
						dest_name :chatee.name,
						sender_id : stateMap.user.id,
						msg_text : msg_text
					};

					_publish_updatechat([msg_map]);
					sio.emit('updatechat',msg_map);
					return true;
				};

				set_chatee = function(person_id){
					var new_chatee;
					new_chatee = stateMap.people_cid_map[person_id];
					if(new_chatee){
						if(chatee && chatee.id === new_chatee.id){
							return false;
						}
					}
					else{
						new_chatee = null;
					}

					$.gevent.publish('spa-setchatee',{
						old_chatee : chatee,
						new_chatee : new_chatee
					});

					chatee = new_chatee;
					return true;
				};

				update_avatar = function(avatar_update_map){
					var sio = isFakeData? spaFake.mockSio : spaData.getSio();
					if(sio){
						sio.emit('updateavatar',avatar_update_map);
					}
				};

				return {
					_leave : _leave_chat,
					join : join_chat,
					get_chatee : get_chatee,
					send_msg : send_msg,
					set_chatee : set_chatee,
					update_avatar : update_avatar
				};
		})();

		initModule = function(){
			var i,people_list,person_map;
			stateMap.anon_user = makePerson({
				cid : configMap.anon_id,
				id : configMap.anon_id,
				name :'anonymous'		
			});
			stateMap.user = stateMap.anon_user;
		};
	return  {
		people : people,
		chat : chat,
		initModule : initModule
	};
}());