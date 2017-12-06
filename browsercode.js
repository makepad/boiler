
// lets do a fetch connection using the fetch API
fetch('/urltoget').then(response=>{
	response.text().then(value=>{
		console.log('Value of the response: '+value)
	})
})



// websocket example


document.body.innerHTML = 
		"<input id='text' type='text'/>\n"+
		"<input id='send' type='button' value='send'/>"

var textElement = document.getElementById('text')
var sendElement = document.getElementById('send')

function send(){
	websocket.send(textElement.value)
	textElement.value = ''
}

textElement.addEventListener('keyup',event=>{
	if(event.keyCode===13) send()
})

sendElement.addEventListener('click',send)

var websocket = new WebSocket('ws://'+location.host+'/websocket')

websocket.onopen = event=>{
}

websocket.onmessage = event=>{
	div = document.createElement('div')
	div.innerHTML = event.data
	document.body.insertBefore(div, textElement)
}
