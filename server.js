"use strict" 

var Http = require('http')
var Fs = require('fs')
var Url = require('url')
var WebSocket = require('./serversocket')
var ChildProcess = require('child_process')

var serverPort = 2003
var serverRoot = process.cwd()
var liveServerFile = serverRoot + '/servercode.js'

function requestHandler(req, res){

	var host = req.headers.host
	var path = Url.parse(req.url).pathname

	if(path === '/') path = '/index.html'

	if(path === '/$watch'){
		// reload observer
		res.on('close', function(){
			watchResponses.splice(watchResponses.indexOf(res), 1)
		})
		setTimeout(function(){
			res.writeHead(200,{'Content-Type':'text/json'})
			res.end("retry")
		}, 50000)
		watchResponses.push(res)
		return
	}

	if(extHandler && extHandler.onRequest(req ,res)){
		return
	}

	// return filename 
	var extension = path.slice(path.lastIndexOf('.'))
	if(!extension) extension = '.html', path += '.html'

	var mime = mimeTable[extension] || 'application/octet-stream'

	if(path.indexOf('..') !== -1){
		res.writeHead(404)
		res.end()
	}

	var absPath = serverRoot + path

	Fs.stat(absPath, function(err, stat){
		if(err || !stat.isFile()){
			res.writeHead(404,{'Content-Type':'text/html'})
			res.end()
			return
		}

		// lets check the etag
		var etag = stat.mtime.getTime() + stat.size
		if(req.headers['if-none-match'] === etag){
			res.writeHead(304)
			res.end()
			return
		}

		// mark as watched
		watchFiles[absPath] = true
		// now send the file
		var stream = Fs.createReadStream(absPath)
		res.writeHead(200, {
			"Connection": "Close",
			"Cache-control": 'max-age=0',
			"Content-Type": mime,
			'Content-Length':stat.size,
			"etag": etag
		})
		stream.pipe(res)
	})
}

function upgradeHandler(request, socket, header){
	var websocket = new WebSocket(request, socket, header)
	if(extHandler) extHandler.onSocket(websocket, request, header)
}

var mimeTable = {
	'.jpg':'image/jpeg',
	'.gif':'image/gif',
	'.png':'image/png',
	'.html':'text/html',
	'.js':'application/javascript',
	'.ico':'image/x-icon'
}

var watchResponses = []
var watchFiles = {}
var watchTags = {}

function watchPoll(){
	var promises = []
	for(let absPath in watchFiles){
		promises.push(new Promise(function(resolve, reject){
			Fs.stat(absPath, function(absPath, err, stat){
				resolve({absPath: absPath, stat: stat})
			}.bind(null, absPath))
		}))
	}
	Promise.all(promises).then(function(results){
		for(let i = 0; i < results.length; i++){
			var result = results[i]

			result.stat.atime = null
			result.stat.atimeMs = null

			var newTag = JSON.stringify(result.stat)
			var oldTag = watchTags[result.absPath]

			if(oldTag === -1) continue
			if(!oldTag) oldTag = watchTags[result.absPath] = newTag

			if(oldTag !== newTag){
				watchTags[result.absPath] = newTag
				if(result.absPath == liveServerFile){
					process.exit(0)
				}
				for(let i = 0; i < watchResponses.length; i++){
					var res = watchResponses[i]
					res.writeHead(200, {'Content-type':'text/json'})
					res.end("reload")
				}
				watchResponses.length = 0
			}
		}
		setTimeout(watchPoll, 100)
	})
}

// watchdog process
if(process.argv[2] === undefined){
	while(1){
		try{
			ChildProcess.execSync(process.argv[0]+' '+process.argv[1]+' -b',{stdio:[process.stdin, process.stdout, process.stderr]})
		}
		catch(e){
			console.log(e)
		}
	}
}

var server = Http.createServer(requestHandler)
var extHandler

// lets watch this module

watchFiles[liveServerFile] = true

server.on('upgrade', upgradeHandler)

server.listen(serverPort, '127.0.0.1', function(err){
	if (err) {
		return console.log('Server cannot start: ', err)
	}
	console.log('\n------- Server restarted on http://127.0.0.1 -------')

	try{
		extHandler = require(liveServerFile)
	}
	catch(e){
		console.log(e)
	}

	watchPoll()
})
