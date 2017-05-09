/*
spa.js
Root namespace module
 */

var spa = (function(){
	'use strict';

	var initModule = function($container){
		spaModel.initModule();
		spaData.initModule();
		spaShell.initModule($container);
	};
	return { initModule : initModule};
}());

$(function(){
	spa.initModule($("#spa"));
});

$('body').append('<div id="spa-chat-list-box"></div>');
var $listbox = $('#spa-chat-list-box');
$listbox.css({
	'position':'absolute',
	'z-index':3,
	'top':50,
	'left':50,
	'width':50,
	'height':50,
	'border':'2px solid black',
	'background':'#fff'

});

var onListChange = function(event,update_map){
	$(this).html(update_map.list_text);
	alert('onListChange run');
};

$.gevent.subscribe($listbox,'spa-listchange',onListChange);
$.gevent.publish('spa-listchange',[{list_text:'the list is here'}]);
$listbox.remove();
$.gevent.publish('spa-listchange',[{}]);





































































// // 将代码封装在spa名字空间之中，形成闭包，在(function($) {…})(jQuery)在内部定义的函数和变量只能在此范围内有效。
// var spa = (function($){
// 	var 
// 		configMap = {
// 			extended_height:434,
// 			extended_title:'Click to retract',
// 			retracted_height:16,
// 			retracted_title:'Click to extend',
// 			template_html:'<div class="spa-slider"><\/div>'
// 		},
// 		$chatSlider,
// 		toggleSlider,onClickSlider,initModule;

// // DOM方法聚集在一个区块中
// 	toggleSlider = function(){
// 		var slider_height = $chatSlider.height();

// 		if(slider_height === configMap.retracted_height){
// 			$chatSlider
// 				.animate({height:configMap.extended_height})
// 				.attr('title',configMap.extended_title);
// 			return true;
// 		}
// 		else if(slider_height === configMap.extended_height){
// 			$chatSlider
// 				.animate({height:configMap.retracted_height})
// 				.attr('title',configMap.retracted_title);
// 			return true;
// 		}
// 			return false;
// 	};

// // 事件处理程序聚集在一个小区块中
// 	onClickSlider = function(){
// 		toggleSlider();
// 		return false;
// 	};

// // 把公开方法聚集在一个区块中
// 	initModule = function($container){
// 		$container.html(configMap.template_html);

// 		$chatSlider = $container.find(".spa-slider");

// 		$chatSlider
// 			.attr('title',configMap.retracted_title)
// 			.click(onClickSlider);
// 		return true;
// 	};

// 	// 通过返回spa名字空间中的对象，导出公开方法
// 	return {initModule:initModule};
// })(jQuery);

// $(function(){
// 	spa.initModule($('#spa'));
// });