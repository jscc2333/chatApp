/*
 spa.shell.js
 shell module for SPA
 */

var spaShell = (function(){
	var 
		configMap={
			anchor_schema_map:{
				chat:{opened:true,closed:true}
			},
			main_html:String()+
			'<div class="spa-shell-head">' +
				'<div class="spa-shell-head-logo">'+
					'<h1>C</h1>' +
					'<p>chat with anyone</p>'+
				'</div>' +
				'<div class="spa-shell-head-acct"></div>' +
			'</div>' +
			'<div class="spa-shell-main">' +
				'<div class="spa-shell-main-nav"></div>' +
				'<div class="spa-shell-main-content"></div>' +
			'</div>' +
			'<div class="spa-shell-foot"></div>' +
			'<div class="spa-shell-modal"></div>',
			loginHtml:String()+
			'<div class="spa-shell-login">' +
				'<form>' +
					'<ul>' +
						'<li>' +
							'<label for="name">用户名:</label><input type="text" id="name" required="required"  placeholder="输入用户名">' +
						'</li>' +
						'<li>' +
							'<label for="password">密码:</label><input type="password" id="password" required="required" placeholder="输入至少6位数的密码">' +
						'</li>' +
						'<li>' +
							'<input type="button" id="confirm" value="确认"><input type="button" id="cancel" value="取消">' +
						'</li>' +
					'</ul>' +
				'</form>' +
			'</div>',
			chat_extend_time:1000,
			chat_extend_height:450,
			chat_retract_time:300,
			chat_retract_height:15,
			chat_extended_title:'Click to retract',
			chat_retracted_title:'Click to extend',
			resize_interval : 200
		},
		stateMap = { 
			$container : null,
			anchor_map : {},
			resize_idto : undefined
		},
		jqueryMap = {},
		copyAnchorMap,changeAnchorPart,onHashchange,onResize,
		onTapAcct,onTapButton,onLogin,onLogout,onLogerror,
		setJqueryMap,setChatAnchor,onClickChat,initModule;

	// 设置jquery DOM操作的节点
	setJqueryMap = function(){
		var $container = stateMap.$container;
		jqueryMap = { 
			$container : $container, 
			$acct　: $container.find('.spa-shell-head-acct'),
			$nav : $container.find('.spa-shell-main-nav'),
			$button :null
		};
	};

	copyAnchorMap = function(){
		return $.extend(true, {}, stateMap.anchor_map);
	};

	changeAnchorPart = function(arg_map){
		var
			anchor_map_revise = copyAnchorMap(),
			bool_return = true,
			key_name,key_name_dep;

		KEYVAL:
		for(key_name in arg_map){
			if(arg_map.hasOwnProperty(key_name)){
				if(key_name.indexOf('_') === 0){
					continue KEYVAL;
				}
				anchor_map_revise[key_name] = arg_map[key_name];
				key_name_dep = '_'+key_name;
				if(arg_map[key_name_dep]){
					anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
				}else{
					delete anchor_map_revise[key_name_dep];
					delete anchor_map_revise['_s'+key_name_dep];
				}
			}
		}
		try{
			$.uriAnchor.setAnchor(anchor_map_revise);
		}catch(e){
			$.uriAnchor.setAnchor(stateMap.anchor_map,null,true);
			bool_return = false;
		}
		return bool_return;
	};

	onResize = function(){
		if(stateMap.resize_idto){
			return true;
		}
		spaChat.handleResize();
		stateMap.resize_idto = setTimeout(function(){
			stateMap.resize_idto = undefined;
		},configMap.resize_interval);
		return true;
	};

	// 触发锚点变化
	onHashchange = function(event){
		var
			anchor_map_previous = copyAnchorMap(),
			anchor_map_proposed,
			_s_chat_previous,_s_chat_proposed,
			s_chat_proposed;
			is_ok = true;
		try{
			anchor_map_proposed = $.uriAnchor.makeAnchorMap();
		}catch(error){
			$.uriAnchor.setAnchor(anchor_map_previous,null,true);
			return false;
		}
		stateMap.anchor_map = anchor_map_proposed;

		// 前一锚点状态
		_s_chat_previous = anchor_map_previous._s_chat;
		// 当前状态
		_s_chat_proposed = anchor_map_proposed._s_chat;

		if(  !anchor_map_previous || _s_chat_previous !== _s_chat_proposed){
			s_chat_proposed = anchor_map_proposed.chat;
			switch(s_chat_proposed){
				case 'opened':
					is_ok = spaChat.setSliderPosition('opened');break;
				case 'closed':
					is_ok = spaChat.setSliderPosition('closed');break;
				default:
					spaChat.setSliderPosition('closed');
					delete anchor_map_proposed.chat;
					$.uriAnchor.setAnchor(anchor_map_proposed,null,true);
			}
		}
		if(!is_ok){
			if(anchor_map_previous){
				$.uriAnchor.setAnchor(anchor_map_previous,null,true);
				stateMap.anchor_map = anchor_map_previous;
			}
			else{
				delete anchor_map_proposed.chat;
				$.uriAnchor.setAnchor(anchor_map_proposed,null,true);
			}
		}
		return false;
	};

	onTapAcct = function(event){
		var acct_text,user_name,
			user = spaModel.people.get_user();
		if(user.get_is_anon()){
			stateMap.$container.append(configMap.loginHtml);
			jqueryMap.$button = stateMap.$container.find('.spa-shell-login input[type=button]');
			jqueryMap.$button.bind('click',onTapButton);
			jqueryMap.$acct.text('...正在登陆...');

		}
		else{
			spaModel.people.logout();
		}
		return false;
	};

	onTapButton = function(event){
		var 
			user_name,password,
			value = event.target.value;
			$name = jqueryMap.$container.find('#name');
			$password = jqueryMap.$container.find('#password');

		user_name = $name.val();
		password = $password.val();

		switch (value) {
			case "确认":
				spaModel.people.login(user_name,password);
				break;
			case "取消":
				jqueryMap.$container.find('.spa-shell-login').remove();
				spaModel.people.logout();
				jqueryMap.$acct.text('请登录');
				break;
			default:
				break;
		}
	};
	onLogin = function(event,login_user){
		console.log(login_user);
		stateMap.$container.find('.spa-shell-login').remove();
		jqueryMap.$acct.text(login_user.name);
	};

	onLogout = function(event,logout_user){
		jqueryMap.$acct.text('请登录');
	};

	onLogerror = function(event,error){
		var $password = jqueryMap.$container.find('#password');

		console.log(error.msg);
		if(error.msg.indexOf("wrong password") >= 0){
			$password.addClass('wrong-password');
		}else{
			jqueryMap.$acct.text('请登录');			
		}
		
	};

	setChatAnchor = function(position_type){
		return changeAnchorPart({chat : position_type});
	};


	// 初始化模块功能
	initModule = function($container){
		stateMap.$container = $container;
		
		stateMap.$container.html(configMap.main_html);
		setJqueryMap();

		
		// stateMap.is_chat_retracted = true;
		// jqueryMap.$chat.attr({
		// 	'title':configMap.chat_retracted_title
		// }).click(onClickChat);

		spaChat.configModule({
			set_chat_anchor : setChatAnchor,
			chat_model : spaModel.chat,
			people_model : spaModel.people
		});
		spaChat.initModule(jqueryMap.$container);

		spaAvtr.configModule({
			chat_model : spaModel.chat,
			people_model : spaModel.people
		});
		spaAvtr.initModule(jqueryMap.$nav);

		$.uriAnchor.configModule({
			schema_map:configMap.anchor_schema_map
		});
		$(window).bind('resize',onResize)
				.bind('hashchange',onHashchange)
				.trigger('hashchange');
		
		$.gevent.subscribe($container,'spa-login',onLogin);
		$.gevent.subscribe($container,'spa-logout',onLogout);
		$.gevent.subscribe($container,'spa-logerror',onLogerror);
		jqueryMap.$acct.text('请登录')
						.bind('utap',onTapAcct);
	};

	// 公开方法
	return { initModule : initModule };
}());


