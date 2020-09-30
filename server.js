// Dependants -------------------------------------->
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const request = require('request');
const fs = require('fs');
const WebSocket = require('ws');
// END Dependants -------------------------------------->


const rooms = {};


const server = new https.createServer({
  cert: fs.readFileSync('keys/cert.cert'),
  key: fs.readFileSync('keys/key.pem')
});
 const wss = new WebSocket.Server({
   server,
      maxPayload: 300,	
   });
 
 server.listen(2053);




wss.on("connection", function(socket, req) {
	//console.log(req.headers)
 // create a uuid for this connection
  const uuid = uuidv4(); 

  const leave = room => {
    // not present: do nothing
    if(! rooms[room][uuid]) return;

    // if the one exiting is the last one, destroy the room
    if(Object.keys(rooms[room]).length === 1) delete rooms[room];
    // otherwise simply leave the room
    else delete rooms[room][uuid];
  };

  socket.on("message", data => {
	  // make sure its a json or just kickem!
	  let parsed;
	  try {
	   parsed = JSON.parse(data);
	  }catch (e){
		socket.close()
	return console.log("error parsing json");
	}
	
    const { message, meta, room } = parsed
	
	
	  console.log(message)

    if(meta === "join") {
		console.log(uuid)
      if(! rooms[room]) rooms[room] = {}; // create the room
      if(! rooms[room][uuid]) rooms[room][uuid] = socket; // join the room
	  
	  console.log(rooms)
    }
    else if(meta === "leave") {
      leave(room);
    }
    else if(! meta) {
      // send the message to all in the room
	 let sendit = new Object();
	 sendit.message = message;
	  

          if(room in rooms)
		  Object.entries(rooms[room]).forEach(client => {
		   client[1].send(JSON.stringify(sendit))
		}); 
	
    }
  });

  socket.on("close", () => {
    // for each room, remove the closed socket
    Object.keys(rooms).forEach(room => leave(room));
  });
});

 