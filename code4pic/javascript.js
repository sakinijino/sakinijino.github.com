//HTML 5 Local Storage
var user = User(localStorage.getItem('u00000005'));
localStorage.setItem('c00000001', cart.toJson()); 

//Flash LSO
var user = User(SharedObject.getLocal("u00000005").data);
var lso = SharedObject.getLocal("c00000001");
lso.data = cart.toJson();
lso.flush();

//IE userData
var user = User(local.getAttribute("u00000005"));
local.setAttribute("p00000001", cart.toJson());

//---Google Gears Sample---
var db = google.gears.factory.create('beta.database');
db.open('demo-app');
//Synchronous SQL execution
var user = User(db.execute('select * from User where id=5'));

//---HTML 5 Database Sample---
var db = openDatabase("demo-app", "1.0");
var user;
//Asynchronous SQL execution
db.transaction(function(tx) {
  tx.executeSql("select * from User where id=5", [], function (tx, result) { 
    user = User(result);
  });
});

//User Class Metadata
{ properties: 
    {
      'id':{type:'string', primaryKey:true},
      'username':{type:'string'},
      'email':{type:'string'},
      ...
    },
  ...
}
