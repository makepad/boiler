console.log("NodeJS server started")

exports.onRequest = function(req, res){
	console.log("Browser is requesting:", req.url)

	if(req.url === '/urltoget'){
		res.writeHead(200,{'Content-Type':'text/text'})
		res.end('Data via http get')
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