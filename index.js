var mysql = require('mysql');
var Parse = require('parse').Parse;
Parse.initialize("4k2WL9VnC1Jq59Yp07gRZ1oWjUtci6LBMBirRZLP", "RV83s9t5IbjCCYAr63ELN1xAth5PDIqdTgm4jM1w");
var mysqlCon = {
    host: '178.63.71.132',
    user: 'rotunnel_sms',
    password: 'BaldedMoveGlumlySome31',
    database: 'rotunnel_sms',
    insecureAuth: true
};
var gammuDB = mysql.createConnection(mysqlCon);
var User = Parse.Object.extend("ShoutUser");


setInterval(function() {
	gammuDB.query("select * from inbox where TextDecoded like '%:sub%' or TextDecoded like '%/%'", function(err, rows, fields) {
	  if (err) console.log(err);
	  if(rows){
	  	console.log('--------New Messages--------');
	  	rows.forEach(function(elem) {
	  	console.log('message:', elem.TextDecoded);
	  	console.log('PhoneNumber',elem.SenderNumber);
	  	HandleMessage(elem);
	  	deleteMessage(elem.ID);
	  	});
	  }
	});
}, 5000);

function HandleMessage (message) {
	 var actions=message.TextDecoded.split(' ');
	 var query = new Parse.Query(User);
     query.equalTo("phoneNumber", message.SenderNumber);
      query.find({
            success: function(results) {
            	if(results.length==0)
            		return;

            	if(actions[0]==':sub'){
            		results[0].set('channels',(results[0].get('channels')||'')+actions[1]);
            		results[0].save();
            		sendMessage(results[0].get('handler'),results[0].get('phoneNumber'),' you have subscribed to '+actions[1]);
            	}else if(actions[0].indexOf('/')==0){
            		var channel=message.TextDecoded.split(' ')[0];
            		console.log('handler:',results[0].get('handler'));
            		console.log('message:',message.TextDecoded);
            		var searchQuery= new Parse.Query(User);
            		searchQuery.contains('channels',channel);
            		searchQuery.find({
            			success:function(broadcastResults){
            				console.log('----Broadcasting-----');
            				broadcastResults.forEach(function(handler) {
            					console.log('phoneNumber:',handler.get('phoneNumber'));
            					console.log('handler:',handler.get('handler'));
            					if(handler.get('handler')!=results[0].get('handler'))
            						sendMessage(results[0].get('handler'),handler.get('phoneNumber'),message.TextDecoded);
            				});
            			}
            		})
            	}
            },
            error: function(error) {
            	console.log('something went wrong with parse:',error);
            }
        });
}

function deleteMessage(id){
	gammuDB.query("delete from inbox where ID="+id, function (err, result) {
	  if (err) throw err;
	  console.log('deleted:',id);
	});
}

function sendMessage(handler,number,message){
	   var post = {
                    DestinationNumber: number,
                    TextDecoded: '@'+handler+message
                };
		gammuDB.query('INSERT INTO outbox SET ?', post, function(err, result) {
		        if (err)
		            console.log(err.toString());
		});
}
