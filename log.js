var LogConf = {
	common : {
		tn : 'extension'
	},
	image : {
		p : 1200002
	},
	fe : {
		pid : 322,
		ua : (function(){
			var ua = navigator.userAgent;
			if(/BIDUBrowser/.test(ua)){
				return 'baidu';
			}else if(/QQBrowser/.test(ua)){
				return 'QQ';
			}else{
				return 'Chrome';
			}
		})(),
		/***
		 * 02   000 000  00
		 * 项目 页面 模块 操作
		 * 例如 	项目 01 	－ 明星粉丝项目
		 * 		页面 000	－ 首页
		 * 		模块 001	－ banner
		 * 			002	－ 导航
		 * 			003 － 瀑布流
		 * 		 	004 － 其他
		 * 		操作	00	－ 展现
		 * 			01 	- 点击
		 * 			02	- 滚动
		 * 			03	- 浮层
		 **/
		logid : '0000000000'
	}
}

var LOG = function(){};
LOG.prototype = {
	guid : 10000,
	feImgSrc : 'http://nsclick.baidu.com/v.gif?',
	imageImgSrc : 'http://imgstat.baidu.com/5.gif?',
	eachParam : function(param){
		var src = '';
		for(var i in param){
			src += '&' + encodeURIComponent(i) + '=' + encodeURIComponent(param[i]);
		}
		return src ? src.slice(1) : src;
	},
	extend : function(){
		var obj = {};
		for(var i = 0, len = arguments.length; i < len; i++){
			if(arguments[i]){
				for(var j in arguments[i]){
					obj[j] = arguments[i][j];
				}
			}
		}
		return obj;
	},
	send : function(src, confParam, param, typeParam){
		var n = "imglog__"+ this.guid++,
            c = window[n] = new Image();
        c.onload=(c.onerror=function(){window[n] = null;});
        c.src = src + this.eachParam(this.extend(param, confParam, typeParam, LogConf.common));  //LOG统计地址
        c = null;//释放变量c，避免产生内存泄漏的可能
	},
	fire : function(p){
		p.type != 'fe' 		&& this.send(this.imageImgSrc, LogConf.image, p.param, p.image);
		p.type != 'image' 	&& this.send(this.feImgSrc, LogConf.fe, p.param, p.fe);
	},
	init : function(){
		var me = this;
		chrome.extension.onMessage.addListener(function(request, sender) {
			if(request.msg == 'log_messages'){
				me.fire(request.param);
			}
		});
	}
}

var log = new LOG();
log.init();
