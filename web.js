var app = require('express')(),
  mongoose = require('mongoose'),
  jade = require('jade');

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
  person.plugin(require('mongoose-simple-random'));
  Person = mongoose.model('person', person);

  console.log('Successfully connected to database');
});

var getRandomInt = function(bound) {
  return Math.floor(Math.random() * (bound));
}

app.get('/', function(req, res) {
  Person.findOneRandom(function(err, person) {
    if (err) {
      res.send(err);
      return;
    }

    var survey = person.surveys[getRandomInt(person.surveys.length)];
    var response = survey.responses[getRandomInt(survey.responses.length)];

    res.send(jade.renderFile('views/index.jade', {
      displayName: person.name,
      gravatar: "about:blank",
      question: response.question,
      answer: response.answer
    }));
  })
});

app.listen(3000, function() {
  console.log('Example app listening on port 3000');
});
