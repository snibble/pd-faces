var app = require('express')();
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
var Person;
db.once('open', function() {
  var response = mongoose.Schema({
    question: String,
    answer: String
  });
  var survey = mongoose.Schema({
    quarter: Number,
    year: Number,
    responses: [response]
  });
  var person = mongoose.Schema({
    name: String,
    email: String,
    surveys: [survey]
  });
  Person = mongoose.model('person', person);

  console.log('Successfully connected to database');
});

app.get('/', function(req, res) {
  Person.find(function(err, persons) {
    if (err) {
      res.send(err)
    } else {
      res.send(persons);
    }
  })
});

app.listen(3000, function() {
  console.log('Example app listening on port 3000');
});
