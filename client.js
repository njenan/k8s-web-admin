/**
 * Copyright (c) 2018 The xterm.js authors. All rights reserved.
 * @license MIT
 *
 * This file is the entry point for browserify.
 */

let term;
let protocol;
let socketURL;
let socket;
let pid;
let attach;
let fit;
let webLinks;

const terminalContainer = document.getElementById('terminal-container');

createTerminal();

let zrows;
let zcols;

function createTerminal() {
  // Clean terminal
  while (terminalContainer.children.length) {
    terminalContainer.removeChild(terminalContainer.children[0]);
  }

  const isWindows =
      [ 'Windows', 'Win16', 'Win32', 'WinCE' ].indexOf(navigator.platform) >= 0;
  term = new Terminal({windowsMode : isWindows});

  webLinks = new WebLinksAddon.WebLinksAddon();
  fit = new FitAddon.FitAddon();
  term.loadAddon(webLinks);
  term.loadAddon(fit);

  // window.term = term; // Expose `term` to window for debugging purposes
  term.onResize((size) => {
    if (!pid) {
      return;
    }
    const cols = size.cols;
    const rows = size.rows;
    const url = '/terminals/' + pid + '/size?cols=' + cols + '&rows=' + rows;

    fetch(url, {method : 'POST'});
  });
  protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';
  socketURL = protocol + location.hostname +
              ((location.port) ? (':' + location.port) : '') + '/terminals/';

  term.open(terminalContainer);
  fit.fit();
  term.focus();

  // fit is called within a setTimeout, cols and rows need this.
  setTimeout(() => {
    // TODO: Clean this up, opt-cols/rows doesn't exist anymore
    zcols = term.cols;
    zrows = term.rows;

    // Set terminal size again to set the specific dimensions on the demo
    updateTerminalSize();

    fetch('/terminals?cols=' + term.cols + '&rows=' + term.rows, {
      method : 'POST'
    }).then((res) => {
      res.text().then((processId) => {
        pid = processId;
        socketURL += processId;
        socket = new WebSocket(socketURL);
        socket.onopen = runRealTerminal;
      });
    });
  }, 0);
}

window.addEventListener('resize', updateTerminalSize);

function runRealTerminal() {
  attach = new AttachAddon.AttachAddon(socket);
  term.loadAddon(attach);
  term._initialized = true;
}

function addDomListener(element, type, handler) {
  element.addEventListener(type, handler);
  term._core.register(
      {dispose : () => element.removeEventListener(type, handler)});
}

function updateTerminalSize() {
  const width = innerWidth - 30 + 'px';
  const height = innerHeight - 30 + 'px';
  terminalContainer.style.width = width;
  terminalContainer.style.height = height;
  fit.fit();
}
