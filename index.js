const request=require('request');
const JSONStream=require('json-stream');
const fs=require('fs');
const process=require('process');
const websocket=require('websocket');
const http=require('http');
const readline=require('readline');

"use strict";

var webSocketsServerPort = 8080;
var webSocketServer = websocket.server;

var clients = [];
var data = {};

var server = http.createServer(function(request, response) {});
var wsServer = null;

process.on('uncaughtException', function (err) {
  console.log(err);
})

function dispatch(key) {
	var message = {"request":"one", "key":key, "value":data[key]};
	var json = JSON.stringify(message);
	for (var i=0; i < clients.length; i++) {
		clients[i].sendUTF(json);
	}
}

function produce(key) {
	if (clients.length>0) dispatch(key);
}

function close(connection) {
	var index = -1;
	for (var i=0; i < clients.length; i++) {
		if (connection==clients[i]) {
			index = i;
			break;
		}
	}
	if (index > 0) clients.splice(index, 1);
}

function wsHandle(request) {
	console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
	var connection = request.accept(null, request.origin);
	var index = clients.push(connection) - 1;
	connection.on('message', function(message) {
		if (message.type === 'utf8') {
			var msg = JSON.parse(message.utf8Data);
			if (msg.request === 'all') {
				connection.sendUTF(JSON.stringify({"request":"all", "data":data}));
			}
		}
	});
    connection.on('error', function(connection) {
		console.log((new Date()) + " Peer " + connection.remoteAddress + " error.");
		close(connection);
	});
	connection.on('close', function(connection) {
		console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
		close(connection);
	});
}

function wsStart() {
	server.listen(webSocketsServerPort, function() {});
	wsServer = new webSocketServer({httpServer: server});
	wsServer.on('request', wsHandle);
}

wsStart();

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

rl.on('line', function(line){
	var arr = line.split(' ',5)
	var aipl = arr[2].split('.')
	var ipl = aipl[0]+'.'+aipl[1]+'.'+aipl[2]+'.'+aipl[3]
	var aipd1 = arr[4].split(':')[0]
	var flow = ipl+"-"+aipd1;
	if (! data[flow]) {
		var aipd = aipd1.split('.')
		var ipd = aipd[0]+'.'+aipd[1]+'.'+aipd[2]+'.'+aipd[3]
		var portd = aipd[4]
		if (! data[flow]) {
			data[flow]={"ipl":ipl,"ipd":ipd,"portd":portd}
			produce(flow);
		}
	}
});


