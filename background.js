// JavaScript Document
var screenshot = 
{
	init: function() 
	{
    	localStorage.screenshootQuality = localStorage.screenshootQuality || 'png';
		browserAction.init();
  	},
}

var browserAction = 
{
	init: function()
	{
		chrome.browserAction.onClicked.addListener(function(tab)
		{
			chrome.tabs.captureVisibleTab(null,{format:"png", quality:100}, function(data)
			{
				page.createFakePage();
				alert("create fake page done");
				page.showFakePage(data);
				alert("shoe fake page done");
				page.createFloatLayer();
				alert("creat float done");
				setTimeout(page.createSelectionArea,100);

			});
		});
	},
}

var page = 
{
	createFakePage: function()
	{
		var img = document.createElement("img");
		img.id = "zz_fake";
		document.body.appendChild(img);
		page.fake = img;
		return img;
	},
	
	createFloatLayer: function()
	{
		page.createDiv(document.body,"sc_drag_area");
	},
	
	createDiv: function(parent,id)
	{
		var div = document.createElement("div");
		div.id = id;
		parent.appendChild(div);
		return div;
	},
	
	createSelectionArea: function()
	{
		var area = document.getElementById("sc_drag_area");
		area.style.width = Math.round(document.documentElement.clientWidth)+"px";
		area.style.height = Math.round(document.documentElement.clientHeight)+"px";
		event.stopPropagation();
		alert("selection area done");
		return false;
	},
	
	showFakePage: function(data)
	{
		page.fake.src = data;
		page.fake.style.display = "none";
		document.body.style.overflow = "hidden";
		document.documentElement.style.over = "";
	},
}

var app = 
{
	init: function()
	{
		screenshot.init();
	}
}

app.init();