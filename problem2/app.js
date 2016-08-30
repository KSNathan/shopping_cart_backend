var express = require('express'),
app = express(),
http = require('http'),_object = require('underscore');
httpServer = http.Server(app);
var SERVER_PORT = 3002;
var products = require('underscore');
var path = require('path');
var username="empty";
var io = require('socket.io');
var server = http.createServer(app).listen(SERVER_PORT, function() {
    console.log('Express server listening on port ' + SERVER_PORT);
});
var listener =io.listen(server);
listener.sockets.on('connection',function(sock){
	
	sock.on('getname',function(msg){
		sock.emit('take_name',{'text':username});
	});
});

//setting the status of the user.
var bodyParser = require("body-parser");
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var url = 'mongodb://localhost:27017/onlinestore';
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req,res,next){
res.header('Access-Control-Allow-Origin','*');
res.header('Access-Control-Allow-Methods','*');
res.header('Access-Control-Allow-Headers','Content-Type');
next();
});


app.get('/', function(req, res) {//produces the basic home page
  res.sendFile(__dirname + '/public/src/index.html');
});
app.get('/home.html',function(req,res){
	res.sendFile(__dirname + '/public/src/home.html');
});
app.get('/success',function(req,res){
	res.sendFile(__dirname+ '/public/src');
});
app.post('/login',function(req,res){//This handles api 'get'calls from the client
	
	var login = {"email":req.body.email_login};
	console.log(login);
	MongoClient.connect(url,function(err,db){
		//assert.equal(null,err);
		if(err){
			console.log(err);
		}else
		{
			var prev_regs = db.collection('users');
			var value = prev_regs.find(login,{timeout:false}).count()//checking whether there are already members or not
				.then(function(number){
					console.log(number);
					if(number > 0){
						res.send("Success");
					}else{
						res.send("Fail");
					}
					callback(number);
				});
			//console.log(value);
			
			db.close();
		}
	});
});

app.post('/submit',function(req,res){//Handles the user details while registration
	
	var values = req.body.fname + req.body.lname + req.body.email + req.body.mobile + req.body.pwd;
	var first = req.body.fname;
	var last = req.body.lname;
	username = first + " "+last;
	var mail = req.body.email;
	var mobile_no = req.body.mobile;
	var pass = req.body.pwd;
	var collection;
	var flag;
	console.log(values);
	//
	MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
	//return_obj = db;
    console.log('Connection established to', url);
	var new_user = {"first_name":first,"last_name":last,"email":mail,"mobile":mobile_no,"password":pass,"log_in_status":false};
    // do some work here with the database.
	var the_mail = {"email":mail};
	collection = db.collection('new_users');
	var value = collection.find(the_mail).count().then(function(number){
		console.log(number);
		
		if(number > 0){
			res.send("Failure");
		}else{
			res.send("Success");
			collection.insert(new_user,function(err,result){
			if(err){
				console.log(err);
			}else{
				console.log("Enterd"+result+" elemenets");
				
			}
			});
			//flag = true;
			
			}
		callback(number);
	});
	if(flag == true){
		
	}
	 //db.close();
		}
		
	});
  
});


	

app.listen(3000);