var appRouter = function(app) {
	app.get('/',function(req,res){
		res.sendFile(__dirname + '/registration.html');
	});
	app.get('/register',function(req,res){
	var final_term = req.form_register.fname + req.form_register.lname;
	res.send("Succesfully registered");
	return final_term;
	});
	
}
module.exports = appRouter;