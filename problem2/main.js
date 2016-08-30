var http = require('http');
var fs = require('fs');
var url = require('url');
var io = require('socket.io');

var server = http.createServer(function(req,res){
	var path = url.parse(req.url).pathname;
	console.log(path);
	switch(path){
            case '/':
				var p = path + 'index.html';
               fs.readFile(__dirname + p,function(err,data){
				   if (err){
                        res.writeHead(404);
                        res.write("opps this doesn't exist - 404");
                        res.end();
                    }
                    else{
                        res.writeHead(200, {"Content-Type": "text/html"});
                        res.write(data, "utf8");
                        res.end();
                    }
			   });
                break;
            case '/registration.html':
				
                fs.readFile(__dirname + path, function(error, data){
                    if (error){
                        res.writeHead(404);
                        res.write("opps this doesn't exist - 404");
                        res.end();
                    }
                    else{
                        res.writeHead(200, {"Content-Type": "text/html"});
                        res.write(data, "utf8");
                        res.end();
                    }
                });
                break;
			case '/login.html':
				fs.readFile(__dirname+path, function(error, data){
                    if (error){
                        res.writeHead(404);
                        res.write("opps this doesn't exist - 404");
                        res.end();
                    }
                    else{
                        res.writeHead(200, {"Content-Type": "text/html"});
                        res.write(data, "utf8");
                        res.end();
                    }
                });
            default:
                res.writeHead(404);
                res.write("opps this doesn't exist - 404");
                res.end();
                break;
        }
	
}).listen(13001);
var listener = io.listen(server);
listener.sockets.on('connection',function(socket){
	socket.on('login_button',function(msg){
		
	});
	socket.on('');
	
});