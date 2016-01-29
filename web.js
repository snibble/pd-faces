var express = require('express'),
  mongoose = require('mongoose'),
  jade = require('jade'),
  crypto = require('crypto');

require('array.prototype.find');

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
};

var renderRandomResponse = function(person, survey) {
  var response = survey.responses[getRandomInt(survey.responses.length)];
  return jade.renderFile('views/index.jade', {
    displayName: person.name,
    avatarURL: "https://www.gravatar.com/avatar/" + crypto.createHash('md5').update(person.email.trim().toLowerCase()).digest('hex') + "?r=pg&d=retro&s=512",
    question: response.question,
    baseQuestion: response.question.substring(0, response.question.indexOf('?')+1),
    answer: response.answer
  });
};

var app = express();
app.use(express.static('public'));
app.get('/forever', function(req, res, next) {
  Person.findOneRandom(function(err, person) {
    if (err) {
      res.send(err);
      return;
    } else if (!person) {
      return next(new Error("No survey results found. Good luck."));
    }

    res.send(renderRandomResponse(person, person.surveys[getRandomInt(person.surveys.length)]));
  })
});

var getQuarter = function (d) {
  d = d || new Date(); // If no date supplied, use today
  var q = [1,2,3,4];
  return {year: d.getFullYear(), quarter: q[Math.floor(d.getMonth() / 3)]};
};

app.get('/:year(\\d{4})?/:quarter(\\d)?', function(req, res, next) {
  var year = req.params.year, quarter = req.params.quarter, filters = {"year": year, "quarter": quarter};
  if (!req.params.year) { // use previous quarter
    var d = new Date();
    d.setMonth(d.getMonth() - 3);
    var q = getQuarter(d);
    year = q.year
    quarter = q.quarter;
    filters = {"year": year, "quarter": quarter}
  } else if (!req.params.quarter) { // use entire year
    filters = {"year": year}
  }

  Person.findOneRandom({surveys: {"$elemMatch": filters}}, {}, {}, function(err, person) {
    if (err) {
      res.send(err);
      return;
    } else if (!person) {
      return next(new Error("No survey results found. Try a different quarter or check out /forever instead."));
    }

    res.send(renderRandomResponse(person, person.surveys.find(function(el) {
      return quarter ? el.year == year && el.quarter == quarter : el.year == year;
    })));
  });
});

app.get('/faq', function(req, res) {
  res.send(jade.renderFile('views/what.jade'));
});

// error handling
app.use(function(err, req, res, next) {
  console.error(err.stack);
  next(err);
});
app.use(function(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ error: 'Something failed!' });
  } else {
    next(err);
  }
});
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send(jade.renderFile('views/error.jade', {error: err}));
});
app.use(function(req, res, next) {
  res.status(404);
  res.send(jade.renderFile('views/error.jade', {error: "404 not found"}));
});

app.listen(3000, function() {
  console.log('Example app listening on port 3000');
});
