
var bg = chrome.extension.getBackgroundPage();

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
  if (isHighVersion()) {
    $('lossyScreenShot').innerText += ' (JPEG)';
    $('losslessScreenShot').innerText += ' (PNG)';
  }
 
   $('saveAndClose').addEventListener('click', saveAndClose);
  initScreenCaptureQuality();
  initEngine();
  HotKeySetting.setup();
}

function save() {
  localStorage.screenshootQuality =
      $('lossy').checked ? 'jpeg' : '' ||
      $('lossless').checked ? 'png' : '';
  localStorage.srcOpt =
      $('baidu').checked ? 'baidu' : '' ||
      $('sogou').checked ? 'sogou' : '' ||
      $('360').checked ? '360' : '';
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

function initEngine(){
  $('sogou').checked = localStorage.srcOpt == 'sogou';
  $('360').checked = localStorage.srcOpt == '360';
  $('baidu').checked = localStorage.srcOpt == 'baidu';
}

function i18nReplace(id, name) {
  return $(id).innerText = chrome.i18n.getMessage(name);
}

const CURRENT_LOCALE = chrome.i18n.getMessage('@@ui_locale');
if (CURRENT_LOCALE != 'zh_CN') {
  UI.addStyleSheet('./i18n_styles/en_options.css');
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
            function (element) {
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
