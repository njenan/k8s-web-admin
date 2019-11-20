var express = require('express');
var expressWs = require('express-ws');
var os = require('os');
var pty = require('node-pty');

// Whether to use binary transport.
const USE_BINARY = os.platform() !== "win32";

function startServer() {
  var app = express();
  expressWs(app);

  var terminals = {}, logs = {};

  app.use('/xterm.css', express.static(__dirname + '/xterm.css'));
  app.get('/logo.png', (req, res) => { // lgtm [js/missing-rate-limiting]
    res.sendFile(__dirname + '/logo.png');
  });

  app.get('/', (req, res) => { // lgtm [js/missing-rate-limiting]
    res.sendFile(__dirname + '/index.html');
  });

  app.get('/style.css', (req, res) => { // lgtm [js/missing-rate-limiting]
    res.sendFile(__dirname + '/style.css');
  });

  app.use('/client.js', express.static(__dirname + '/client.js'));
  app.use('/node_modules', express.static(__dirname + '/node_modules'));
  app.use('/src', express.static(__dirname + '/src'));

  app.post('/terminals', (req, res) => {
    const env = Object.assign({}, process.env);
    env['COLORTERM'] = 'truecolor';
    var cols = parseInt(req.query.cols), rows = parseInt(req.query.rows),
        term = pty.spawn('bash', [], {
          name : 'xterm-256color',
          cols : cols || 80,
          rows : rows || 24,
          cwd : "/home/kube-user",
          env : env,
          encoding : USE_BINARY ? null : 'utf8'
        });

    console.log('Created terminal with PID: ' + term.pid);
    terminals[term.pid] = term;
    logs[term.pid] = '';
    term.on('data', function(data) { logs[term.pid] += data; });
    res.send(term.pid.toString());
    res.end();
  });

  app.post('/terminals/:pid/size', (req, res) => {
    var pid = parseInt(req.params.pid), cols = parseInt(req.query.cols),
        rows = parseInt(req.query.rows), term = terminals[pid];

    term.resize(cols, rows);
    console.log('Resized terminal ' + pid + ' to ' + cols + ' cols and ' +
                rows + ' rows.');
    res.end();
  });

  app.ws('/terminals/:pid', function(ws, req) {
    var term = terminals[parseInt(req.params.pid)];
    console.log('Connected to terminal ' + term.pid);
    ws.send(logs[term.pid]);

    // string message buffering
    function buffer(socket, timeout) {
      let s = '';
      let sender = null;
      return (data) => {
        s += data;
        if (!sender) {
          sender = setTimeout(() => {
            socket.send(s);
            s = '';
            sender = null;
          }, timeout);
        }
      };
    }
    // binary message buffering
    function bufferUtf8(socket, timeout) {
      let buffer = [];
      let sender = null;
      let length = 0;
      return (data) => {
        buffer.push(data);
        length += data.length;
        if (!sender) {
          sender = setTimeout(() => {
            socket.send(Buffer.concat(buffer, length));
            buffer = [];
            sender = null;
            length = 0;
          }, timeout);
        }
      };
    }
    const send = USE_BINARY ? bufferUtf8(ws, 5) : buffer(ws, 5);

    term.on('data', function(data) {
      try {
        send(data);
      } catch (ex) {
        // The WebSocket is not open, ignore
      }
    });
    ws.on('message', function(msg) { term.write(msg); });
    ws.on('close', function() {
      term.kill();
      console.log('Closed terminal ' + term.pid);
      // Clean things up
      delete terminals[term.pid];
      delete logs[term.pid];
    });
  });

  var port = process.env.PORT || 3000,
      host = os.platform() === 'win32' ? '127.0.0.1' : '0.0.0.0';

  console.log('App listening to http://127.0.0.1:' + port);
  let server = app.listen(port, host);

  process.on('SIGTERM', shutDown);
  process.on('SIGINT', shutDown);

  function shutDown() {
    console.log('Received kill signal, shutting down gracefully');
    server.close(() => {
      console.log('Closed out remaining connections');
      process.exit(0);
    });

    setTimeout(() => {
      console.error(
          'Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }
}

startServer()
