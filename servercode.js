console.log("Hello on server!")

var https = require('https')
var Url = require('url')

exports.onRequest = function(req, res){
	var parsed = Url.parse(req.url)
	console.log("Browser is requesting:", req.url)
	if(parsed.pathname === '/urltoget'){
		res.writeHead(200,{'Content-Type':'text/text'})
		res.end('get data from server')
		// lets do a forward request (play proxy)
		// https.get('https://google.com', (get) => {
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

exports.onSocket = function(websocket, request, header){
	websocket.onOpen = event=>{
		//console.log("Socket opened from ", request.headers)
	}
	websocket.onMessage = event=>{
		console.log("Socket received: "+event.data)
		websocket.send('Packet from server to ack!')
	}
}