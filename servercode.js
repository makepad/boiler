console.log("Hello on server!")

var https = require('https')
var Url = require('url')

exports.onRequest = function(req, res){

	var parsed = Url.parse(req.url)

	console.log("Browser is requesting:", req.url)

	if(parsed.pathname === '/search'){
		var chunks = parsed.query.split('&')
		for(var i = 0; i < chunks.length; i++){
			var chunk = chunks[i]
			var parts = chunk.split('=')
			if(parts[0] === 'q'){
				res.writeHead(200, {'Content-Type':'text/html'})
				res.end('<html><body>'+parts[1]+'</body></html>')
				return true
			}
		}
	}

	if(parsed.pathname === '/urltoget'){
		res.writeHead(200,{'Content-Type':'text/text'})
		res.end('returned')
		// lets do a forward request (play proxy)
		// https.get('https://www.google.nl', (get) => {
		// 	get.setEncoding('utf8');
		// 	let data = ''
		// 	get.on('data', (chunk) => { data += chunk })
		// 	get.on('end', ()=>{
		// 		res.writeHead(200,{'Content-Type':'text/text'})
		// 		res.end(data)
		// 	})
		// })
		return true
	}

}

var allSockets = []
exports.onSocket = function(websocket, request, header){
	allSockets.push(websocket)
	websocket.onClose = event=>{
		allSockets.splice(allSockets.indexOf(websocket),1)
	}
	websocket.onOpen = event=>{
		//console.log("Socket opened from ", request.headers)
	}
	websocket.onMessage = event=>{
		console.log("Socket received: "+event.data)
		for(var i = 0; i < allSockets.length; i++){
			allSockets[i].send(event.data)
		}
		//websocket.send('Packet from server to ack!')
	}
}