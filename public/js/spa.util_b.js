/*
spa.util_b.js
Javascript browser utilities
 */

spaUtilb = (function(){
	'use strict';

	var 
		configMap = {
			regex_encode_html : /[&"'><]/g,
			regex_encode_noamp : /["'><]/g,
			html_encode_map : {
				'&' : '&#38;',
				'"' : '&#34;',
				"'" : '&#39;',
				'>' : '&#62;',
				'<' : '&#60'
			}
		},
		decodeHtml,encodeHtml,getEmsize,getRandRgb;

		configMap.encode_nomap_map = $.extend({},configMap.html_encode_map);
		delete configMap.encode_nomap_map['&'];

		decodeHtml = function(str){
			return $('<div/>').html(str||'').text();
		};

		encodeHtml = function(input_arg_str,exclude_map){
			var
				input_str = String(input_arg_str),
				regex,lookup_map;
			if(exclude_map){
				lookup_map = configMap.encode_nomap_map;
				regex = configMap.regex_encode_noamp;
			}
			else{
				lookup_map = configMap.html_encode_map;
				regex = configMap.regex_encode_html;
			}
			return input_str.replace(regex,function(match,name){
				return lookup_map[match] || '';
			});
		};

		getEmsize = function(elem){
			return Number(getComputedStyle(elem, '').fontSize.match(/\d*\.?\d*/)[0]);
		};

		getRandRgb =  function(){
			var i,rgb_list = [];
			for(i = 0; i < 3; i++){
				rgb_list.push(Math.floor(Math.random()*256));
			}
			return 'rgb('+rgb_list.join(',')+')';
		};


		return {
			decodeHtml : decodeHtml,
			encodeHtml : encodeHtml,
			getEmsize : getEmsize,
			getRandRgb : getRandRgb
		};
})();

