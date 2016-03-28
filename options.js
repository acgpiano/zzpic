var bg = chrome.extension.getBackgroundPage();

var read = JSON.parse(localStorage.getItem('selfAdd')) || {}; //自定义数据读取

function $(id) {
	return document.getElementById(id);
}

function isHighVersion() {
	var version = navigator.userAgent.match(/Chrome\/(\d+)/)[1];
	return version > 9;
}

function init() {
	i18nReplace('optionTitle', 'options');
	i18nReplace('saveAndClose', 'save_and_close');
	i18nReplace('screenshootQualitySetting', 'quality_setting');
	i18nReplace('lossyScreenShot', 'lossy');
	i18nReplace('losslessScreenShot', 'lossless');
	i18nReplace('shorcutSetting', 'shortcut_setting'); //快捷键设置
	i18nReplace('settingShortcutText', 'shortcutsetting_text');
	i18nReplace('engineChooseTitle', 'engine_choose');
	i18nReplace('baiduName', 'baidu_engine');
	i18nReplace('sogouName', 'sogou_engine');
	i18nReplace('360Name', '360_engine');
	i18nReplace('selfName', 'self_name');
	i18nReplace('selfUrl', 'self_add');
	i18nReplace('selfSave', 'self_save');
	i18nReplace('selfTitle', 'self_title');
	if (isHighVersion()) {
		$('lossyScreenShot').innerText += ' (JPEG)';
		$('losslessScreenShot').innerText += ' (PNG)';
	}
	for (var i in read) {
		$('selfmenu').add(new Option(read[i].name, read[i].url));
	}
	if (localStorage.selfIndex) {
		$('selfmenu').options[localStorage.selfIndex].selected = true;
	}
	$('selfmenu').addEventListener('change', textshow);
	$('saveAndClose').addEventListener('click', saveAndClose);
	$('selfSave').addEventListener('click', selfSave);
	initScreenCaptureQuality();
	initEngine();
	HotKeySetting.setup();
}

function selfSave() { //自定义数据的存储
	if (!$('webname').value || !$('webtext').value) {
		alert("名称和网址为必填!");
		return;
	}
	read[$('webname').value] = {
		name: $('webname').value,
		url: $('webtext').value
	}
	localStorage.setItem('selfAdd', JSON.stringify(read));
	var selfIndex = $('selfmenu').selectedIndex;
	localStorage.selfIndex = selfIndex;
	localStorage.selfurl = $('selfmenu').options[selfIndex].value;
	alert("Success!");
	history.go(0);
	console.log(read);
}

function textshow() {
	var index = $('selfmenu').selectedIndex;
	$('webname').value = $('selfmenu').options[index].text;
	$('webtext').value = $('selfmenu').options[index].value;
}

function save() {
	localStorage.screenshootQuality =
		$('lossy').checked ? 'jpeg' : '' ||
		$('lossless').checked ? 'png' : '';
	localStorage.srcOpt =
		$('baidu').checked ? 'baidu' : '' ||
		$('sogou').checked ? 'sogou' : '' ||
		$('360').checked ? '360' : '' ||
		$('self').checked ? 'selfmenu' : '';
	if ($('self').checked) {
		var selfIndex = $('selfmenu').selectedIndex;
		localStorage.selfIndex = selfIndex;
		localStorage.selfurl = $('selfmenu').options[selfIndex].value;
	}
	return HotKeySetting.save();
}

function saveAndClose() {
	if (save())
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.remove(tab.id);
		});
}

function initScreenCaptureQuality() {
	$('lossy').checked = localStorage.screenshootQuality == 'jpeg';
	$('lossless').checked = localStorage.screenshootQuality == 'png';
}

function initEngine() {
	$('sogou').checked = localStorage.srcOpt == 'sogou';
	$('360').checked = localStorage.srcOpt == '360';
	$('baidu').checked = localStorage.srcOpt == 'baidu';
	$('self').checked = localStorage.srcOpt == 'selfmenu';
}

function i18nReplace(id, name) {
	return $(id).innerText = chrome.i18n.getMessage(name);
}

const CURRENT_LOCALE = chrome.i18n.getMessage('@@ui_locale');
if (CURRENT_LOCALE != 'zh_CN') {
	//UI.addStyleSheet('./i18n_styles/en_options.css');
	UI.addStyleSheet('./style.css');
}

function isWindowsOrLinuxPlatform() {
	return navigator.userAgent.toLowerCase().indexOf('windows') > -1 ||
		navigator.userAgent.toLowerCase().indexOf('linux') > -1;
}

var HotKeySetting = (function() {
	const CHAR_CODE_OF_AT = 64;
	const CHAR_CODE_OF_A = 65;
	const CHAR_CODE_OF_Z = 90;
	var hotKeySelection = null;
	var isWindowsOrLinux = isWindowsOrLinuxPlatform();

	var hotkey = {
		setup: function() {
			hotKeySelection = document.querySelectorAll('#hot-key-setting select');
			// i18n.
			$('area-capture-text').innerText =
				chrome.i18n.getMessage('capture_area');

			for (var i = 0; i < hotKeySelection.length; i++) {
				hotKeySelection[i].add(new Option('--', '@'));
				for (var j = CHAR_CODE_OF_A; j <= CHAR_CODE_OF_Z; j++) {
					var value = String.fromCharCode(j);
					var option = new Option(value, value);
					hotKeySelection[i].add(option);
				}
			}

			$('area-capture-hot-key').selectedIndex =
				HotKey.getCharCode('area') - CHAR_CODE_OF_AT;


			$('settingShortcut').addEventListener('click', function() {
				hotkey.setState(this.checked);
			}, false);

			hotkey.setState(HotKey.isEnabled());

		},

		validate: function() {
			var hotKeyLength =
				Array.prototype.filter.call(hotKeySelection,
					function(element) {
						return element.value != '@'
					}
				).length;
			if (hotKeyLength != 0) {
				var validateMap = {};
				validateMap[hotKeySelection[0].value] = true;

				if (Object.keys(validateMap).length < hotKeyLength) {
					ErrorInfo.show('hot_key_conflict');
					return false;
				}
			}
			ErrorInfo.hide();
			return true;
		},

		save: function() {
			var result = true;
			if ($('settingShortcut').checked) {
				if (this.validate()) {
					HotKey.enable();
					HotKey.set('area', $('area-capture-hot-key').value);

				} else {
					result = false;
				}
			} else {
				HotKey.disable(bg);
			}
			return result;
		},

		setState: function(enabled) {
			$('settingShortcut').checked = enabled;
			UI.setStyle($('hot-key-setting'), 'color', enabled ? '' : '#6d6d6d');
			for (var i = 0; i < hotKeySelection.length; i++) {
				hotKeySelection[i].disabled = !enabled;
			}
			ErrorInfo.hide();
		}
	};
	return hotkey;
})();

var ErrorInfo = (function() {
	return {
		show: function(msgKey) {
			var infoWrapper = $('error-info');
			var msg = chrome.i18n.getMessage(msgKey);
			infoWrapper.innerText = msg;
			UI.show(infoWrapper);
		},

		hide: function() {
			var infoWrapper = $('error-info');
			if (infoWrapper) {
				UI.hide(infoWrapper);
			}
		}
	};
})();

document.addEventListener('DOMContentLoaded', init);