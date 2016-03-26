var screenshot = {
  tab: 0,
  canvas: document.createElement("canvas"),
  startX: 0,
  startY: 0,
  scrollX: 0,
  scrollY: 0,
  docHeight: 0,
  docWidth: 0,
  visibleWidth: 0,
  visibleHeight: 0,
  scrollXCount: 0,
  scrollYCount: 0,
  scrollBarX: 17,
  scrollBarY: 17,
  captureStatus: true,

  handleHotKey: function(keyCode) {
    if (HotKey.isEnabled()) {
      switch (keyCode) {
        case HotKey.getCharCode('area'):
            // add by zhangrongming@baidu.com
            chrome.tabs.getSelected(null, function (tab){
                chrome.tabs.captureVisibleTab(null, {format: "png", quality: 100},function(data){
                    chrome.tabs.sendMessage(tab.id, {msg: 'show_selection_area',data:data}, null);
                });
            });
            break;
      }
    }
  },

  /**
  * Receive messages from content_script, and then decide what to do next
  */
  addMessageListener: function() {
    chrome.extension.onMessage.addListener(function(request, sender, response) {
      var obj = request;
      var hotKeyEnabled = HotKey.isEnabled();
      switch (obj.msg) {
        case 'capture_hot_key':
          screenshot.handleHotKey(obj.keyCode);
          break;
        case 'capture_selected':
          screenshot.captureSelected();
          break;
        case 'capture_area':
            screenshot.showSelectionArea();
          break;
      }
      return true;
    });
  },

  /**
  * Send the Message to content-script
  */
  sendMessage: function(message, callback) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, message, callback);
    });
  },

  showSelectionArea: function() {
    chrome.tabs.captureVisibleTab(null, {format: "png", quality: 100},function(data){
      screenshot.sendMessage({msg: 'show_selection_area',data:data}, null);
    });
  },

  captureSelected: function() {
    screenshot.sendMessage({msg: 'capture_selected'},
        screenshot.captureVisible
    );
  },

  captureVisible: function(response) {

    //console.log(response);
    

    screenshot.startX = response.startX,
    screenshot.startY = response.startY,
    screenshot.scrollX = response.scrollX,
    screenshot.scrollY = response.scrollY,
    screenshot.canvas.width = response.canvasWidth;
    screenshot.canvas.height = response.canvasHeight;
    screenshot.visibleHeight = response.visibleHeight,
    screenshot.visibleWidth = response.visibleWidth,
    screenshot.scrollXCount = response.scrollXCount;
    screenshot.scrollYCount = response.scrollYCount;
    screenshot.docWidth = response.docWidth;
    screenshot.docHeight = response.docHeight;
    screenshot.zoom = response.zoom;





    setTimeout(function(){
      var formatParam = localStorage.screenshootQuality || 'png';
    chrome.tabs.captureVisibleTab(
        null, {format: formatParam, quality: 50}, function(data) {
      var image = new Image();
      image.onload = function() {
        var context = screenshot.canvas.getContext('2d');
        var width = 0;
        var height = 0;

        // Get scroll bar's width.
        screenshot.scrollBarY =
            screenshot.visibleHeight < screenshot.docHeight ? 17 : 0;
        screenshot.scrollBarX =
            screenshot.visibleWidth < screenshot.docWidth ? 17 : 0;

        // Get visible width and height of capture result.
        var visibleWidth =
            (image.width - screenshot.scrollBarY < screenshot.canvas.width ?
            image.width - screenshot.scrollBarY : screenshot.canvas.width);
        var visibleHeight =
            (image.height - screenshot.scrollBarX < screenshot.canvas.height ?
            image.height - screenshot.scrollBarX : screenshot.canvas.height);

        // Get region capture start x coordinate.
        var zoom = screenshot.zoom;
        var x1 = screenshot.startX ;//- Math.round(screenshot.scrollX * zoom);
        var x2 = 0;
        var y1 = screenshot.startY ;//- Math.round(screenshot.scrollY * zoom);
        var y2 = 0;

        if ((screenshot.scrollYCount + 1) * visibleWidth >
            screenshot.canvas.width) {
          width = screenshot.canvas.width % visibleWidth;
          x1 = (screenshot.scrollYCount + 1) * visibleWidth -
              screenshot.canvas.width + screenshot.startX - screenshot.scrollX;
        } else {
          width = visibleWidth;
        }

        if ((screenshot.scrollXCount + 1) * visibleHeight >
            screenshot.canvas.height) {
          height = screenshot.canvas.height % visibleHeight;
          if ((screenshot.scrollXCount + 1) * visibleHeight +
              screenshot.scrollY < screenshot.docHeight) {
            y1 = 0;
          } else {
            y1 = (screenshot.scrollXCount + 1) * visibleHeight +
                screenshot.scrollY - screenshot.docHeight;
          }

        } else {
          height = visibleHeight;
        }
        x2 = screenshot.scrollYCount * visibleWidth;
        y2 = screenshot.scrollXCount * visibleHeight;
        context.drawImage(image, x1, y1, width, height, x2, y2, width, height);
       // screenshot.postImage();

        search.searchByImage( screenshot.canvas.toDataURL("image/png") );
      };
      image.src = data;
    });
    }, 100)

  },

  /**
  * debug to check if the capture is right the size and position
  */
  postImage: function(data , url ) {
      chrome.tabs.create({'url': url||data||screenshot.canvas.toDataURL("image/png")});
  },    

  isThisPlatform: function(operationSystem) {
    return navigator.userAgent.toLowerCase().indexOf(operationSystem) > -1;
  },

  executeScriptsInExistingTabs: function() {
    chrome.windows.getAll(null, function(wins) {
      for (var j = 0; j < wins.length; ++j) {
        chrome.tabs.getAllInWindow(wins[j].id, function(tabs) {
          for (var i = 0; i < tabs.length; ++i) {
            //if (tabs[i].url.indexOf("chrome://") != 0&&tabs[i].url.indexOf("chrome-devtools://") != 0) {
              if (screenshot.checkPermission(tabs[i])) {
              chrome.tabs.executeScript(tabs[i].id, { file: 'page.js' });
              chrome.tabs.executeScript(tabs[i].id, { file: 'shortcut.js' });
              chrome.tabs.executeScript(tabs[i].id, { file: 'isLoad.js'});
            }
          }
        });
      }
    });
  },
  checkPermission:function(tab){
    //chrome-extension://
      return !! (tab.url.match(/^(http:\/\/|https:\/\/)/));

  },
  checkIfCaptrueable : function(tab){
    
    chrome.tabs.sendMessage(tab.id, {msg: 'is_page_capturable'},
          function(response) {
            isScriptLoad = true;
            if (response.msg == 'capturable') {
                //capturable
                 
                  screenshot.showSelectionArea();
                 
                
            } else if (response.msg == 'uncapturable') {
                //uncapturable
              Note.show({
                title:  Local.getLocalText("warning_title"),
                icon : "images/icon_48.png",
                body : Local.getLocalText("special")
              },3000);
            } else {
                //loading
                Note.show({
                  title:  Local.getLocalText("info_title"),
                  icon : "images/loading.gif",
                  body : Local.getLocalText("loading")
                  },3000);
            }
    });    
  },

  captureScreen : function (tab){
        if(!screenshot.checkPermission(tab)){

          return false;
        }
        screenshot.checkIfCaptrueable(tab); 
        return true;
  },

  init: function() {
    localStorage.screenshootQuality = localStorage.screenshootQuality || 'png';
    localStorage.srcOpt = localStorage.srcOpt || "baidu";
    screenshot.executeScriptsInExistingTabs();
    screenshot.addMessageListener();
  }
};

var Local = {
  getLocalText:function (key){
    return chrome.i18n.getMessage(key)||"";
  }
}
var Note = {
  notes:[],
  show: function( o ,timeout) {
    var note = new Notification(o.title,{icon:o.icon,body:o.body});
    if(o.replaceId){
      note.replaceId = o.replaceId;
    }
    Note.notes.push(note);
    note.show();
    if(timeout){
      setTimeout(function(){
          Note.hide(note);
      }, timeout);
    }
    return note;
  },
  hide:function(note){
    if(note&&note.close){
      try{
        note.close();
      }catch(e){

      }
    }
  }
};

var browserAction = {
  init : function (){
      chrome.browserAction.onClicked.addListener(function(tab) {
        
          var result = screenshot.captureScreen(tab);
          if(!result){
              Note.show({
                title:  Local.getLocalText("warning_title"),
                icon : "images/icon_48.png",
                body : Local.getLocalText("special")
              },3000);
          }
      });
  }
};

var contextMenu = {
  imageContextMenu : null,
  pageContextMenu : null,
  init : function(){

      contextMenu.pageContextMenu = chrome.contextMenus.create({
            title: Local.getLocalText("page_context"),
            contexts: ['page'],
            documentUrlPatterns: ["http://*/*", "https://*/*","ftp://*/*","file://*/*"],
            onclick: function(info, tab){
               // console.log("page context:",arguments);

                screenshot.captureScreen(tab);
               
            }
      });
      contextMenu.imageContextMenu = chrome.contextMenus.create({
            title: Local.getLocalText("img_context"),
            contexts: ['image'],
            documentUrlPatterns: ["http://*/*", "https://*/*"],
            targetUrlPatterns: ["http://*/*", "https://*/*"],
            onclick: function(info, tab){
               // console.log("image context:",arguments);
                search.searchBySrc(info);
            }
      });  
  }
};
var search = {
    note:null,
    ajax : window.ajax||null,
    searchBySrc : function(imageInfo){
        var imgOption = localStorage.srcOpt || "baidu";
        var src = imageInfo.srcUrl,
        opts = {
          objurl : encodeURIComponent(src),
          filename : '',
          rt : 0,
          rn : 10,
          ftn : 'extend.chrome.contextMenu',
          ct : 1,
          stt : 0,
          tn : 'shituresult',
          appid : 4
        },url = "";
        if(imgOption == "baidu")
        {
            url = "http://stu.baidu.com/i" + "?" + search.constructQueryString(opts);
            search.createNewTab(url);
        }
        else if(imgOption == "sogou")
        {
            url = "http://pic.sogou.com/ris?query=" + src;
            search.createNewTab(url);
        }
        else
        {
            search.engine360(src);
        }
    },

    searchByImage : function(data){
        var opts = {
          appid : 4 ,
          appname : "extend.chrome.capture",
          rt : 0,
          rn : 10,
          ct : 0,
          stt : 0,
          tn : "shituresult"
        },

        urlPre = '/i',
        url = "http://stu.baidu.com" + urlPre + "?" + search.constructQueryString(opts) ;
        search.ajax({
          url : url,
          method : "POST",
          success : search.success,
          progress : search.progress,
          multipartData : {
            boundary:'----WebKitFormBoundary',
            name:"dragimage",
            value : "captrue"+new Date().getTime(),
            type : "image/png",
            data : data
          },
          parameters : {
            image:"",
            filename : ""
          }
        });
        search.replaceId = 100;
        //search.note = Note.show({title:Local.getLocalText("info_title"),icon:"images/loading.gif",body:Local.getLocalText("progress_info"),replaceId:search.replaceId});
          screenshot.sendMessage({
            msg:"showProgress",
            data:{
              complete:0,
              total:1
            }
          });
    },
    progress : function(complete,total){
        screenshot.sendMessage({
          msg:"showProgress",
          data:{
            complete:complete,
            total:total
          }
        });
        //console.log(complete,total);
        //var radio = complete/total*100;
       // radio = radio.toFixed(2);
        //search.note = Note.show({title:Local.getLocalText("info_title"),icon:"images/loading.gif",body:"("+radio+" %) "+Local.getLocalText("progress_info"),replaceId:search.replaceId});

    },
    success :  function(response){
      //Note.hide(search.note);
      //Note.show({title:Local.getLocalText("info_title"),icon:"images/icon_48.png",body:Local.getLocalText("search_ok")},2000);
        screenshot.sendMessage({
          msg:"hideProgress"
        });
       setTimeout(function(){//remove the progress bar shadow
        var imgOpt = localStorage.srcOpt || "baidu";
        if(imgOpt == "baidu")
        {
            search.createNewTab(response);
        }
        else if(imgOpt == "sogou")
        {
            search.createNewTab("http://pic.sogou.com/ris?query="+response.substr(80));//替换成搜狗
        }
        else
        {
            var deUrl = search.urlDecode(response.substr(80));
            var numEnd = deUrl.match(/&/).index;
            search.engine360(deUrl.substr(0,numEnd));
        }
        },10);
    },
    createNewTab : function(url){
      chrome.tabs.create({url:url});
    },
    constructQueryString : function (parameters) {
      var tmpParameter = [];
      for(var name in parameters) {
        var value = parameters[name];
        if (value.constructor == Array) {
          value.forEach(function(val) {
            tmpParameter.push(name + '=' + val);
          });
        } else {
          tmpParameter.push(name + '=' + value);
        }
      }
      return tmpParameter.join('&');
    },
    urlDecode : function(str){
        var ret="";
        for(var i=0;i<str.length;i++){
            var chr = str.charAt(i);
            if(chr == "+"){
                ret+=" ";
            }else if(chr=="%"){
                var asc = str.substring(i+1,i+3);
                if(parseInt("0x"+asc)>0x7f){
                    ret+=String.fromCharCode(parseInt("0x"+asc+str.substring(i+4,i+6)));
                    i+=5;
                }else{
                    ret+=String.fromCharCode(parseInt("0x"+asc));
                    i+=2;
                }
            }else{
                ret+= chr;
            }
        }
        return ret;
    },
    engine360 : function(url){
        var myForm = document.createElement("form");
        myForm.method = "post";
        myForm.action = "http://st.so.com/stu";
        myForm.id = "stForm";
        myForm.setAttribute("target","_blank");
        var myInput = document.createElement("input");
        myInput.id = "stInput";
        myInput.setAttribute("name","imgurl");
        myInput.setAttribute("value",url);
        myForm.appendChild(myInput);
        myForm.submit();
        document.body.removeChild(myForm);
    },
    init:function(opt){
        for(var i in opt){
          search[i] = opt[i];
        }
    }


};
var app = {
  init : function(){

      screenshot.init();
      browserAction.init();
      contextMenu.init();
      search.init({
       
        ajax : window.ajax
      });
      HotKey.setup();


    }

};
app.init();

