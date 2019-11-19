/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./client.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./client.js":
/*!*******************!*\
  !*** ./client.js ***!
  \*******************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("/**\n * Copyright (c) 2018 The xterm.js authors. All rights reserved.\n * @license MIT\n *\n * This file is the entry point for browserify.\n */\n\nlet term;\nlet protocol;\nlet socketURL;\nlet socket;\nlet pid;\n\nconst addons = {\n  attach : {name : 'attach'},\n  fit : {name : 'fit'},\n  'web-links' : {name : 'web-links'}\n};\n\nlet attach;\nlet fit;\nlet webLinks;\n\nconst terminalContainer = document.getElementById('terminal-container');\n\ncreateTerminal();\n\nlet zrows;\nlet zcols;\n\nfunction createTerminal() {\n  // Clean terminal\n  while (terminalContainer.children.length) {\n    terminalContainer.removeChild(terminalContainer.children[0]);\n  }\n\n  const isWindows =\n      [ 'Windows', 'Win16', 'Win32', 'WinCE' ].indexOf(navigator.platform) >= 0;\n  term = new Terminal({windowsMode : isWindows});\n\n  webLinks = new WebLinksAddon.WebLinksAddon();\n  fit = new FitAddon.FitAddon();\n  term.loadAddon(webLinks);\n  term.loadAddon(fit);\n\n  // window.term = term; // Expose `term` to window for debugging purposes\n  term.onResize((size) => {\n    if (!pid) {\n      return;\n    }\n    const cols = size.cols;\n    const rows = size.rows;\n    const url = '/terminals/' + pid + '/size?cols=' + cols + '&rows=' + rows;\n\n    fetch(url, {method : 'POST'});\n  });\n  protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';\n  socketURL = protocol + location.hostname +\n              ((location.port) ? (':' + location.port) : '') + '/terminals/';\n\n  term.open(terminalContainer);\n  fit.fit();\n  term.focus();\n\n  // fit is called within a setTimeout, cols and rows need this.\n  setTimeout(() => {\n    // TODO: Clean this up, opt-cols/rows doesn't exist anymore\n    zcols = term.cols;\n    zrows = term.rows;\n\n    // Set terminal size again to set the specific dimensions on the demo\n    updateTerminalSize();\n\n    fetch('/terminals?cols=' + term.cols + '&rows=' + term.rows, {\n      method : 'POST'\n    }).then((res) => {\n      res.text().then((processId) => {\n        pid = processId;\n        socketURL += processId;\n        socket = new WebSocket(socketURL);\n        socket.onopen = runRealTerminal;\n      });\n    });\n  }, 0);\n}\n\nwindow.addEventListener('resize', updateTerminalSize);\n\nfunction runRealTerminal() {\n  attach = new AttachAddon.AttachAddon(socket);\n  term.loadAddon(attach);\n  term._initialized = true;\n}\n\nfunction addDomListener(element, type, handler) {\n  element.addEventListener(type, handler);\n  term._core.register(\n      {dispose : () => element.removeEventListener(type, handler)});\n}\n\nfunction updateTerminalSize() {\n  const width = innerWidth - 30 + 'px';\n  const height = innerHeight - 30 + 'px';\n  terminalContainer.style.width = width;\n  terminalContainer.style.height = height;\n  fit.fit();\n}\n\n\n//# sourceURL=webpack:///./client.js?");

/***/ })

/******/ });