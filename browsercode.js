document.body.innerHTML = 'Hello in browser'

// lets do a fetch connection using the fetch API
fetch('/urltoget').then(response=>{
	response.text().then(value=>{
		console.log('Value of the response: '+value)
	})
})

// lets do a websocket packet connection for the fun of it
var websocket = new WebSocket('ws://'+location.host+'/websocket')
websocket.onopen = event=>{
	//websocket.send('Packet from client!')
}

websocket.onmessage = event=>{
	console.log('Received from websocket: ' + event.data)
}
