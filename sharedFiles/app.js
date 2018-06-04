// Packages: path, express, express-session, nunjucks
const path = require('path');
const express = require( 'express' );
const session = require('express-session');
const nunjucks = require('nunjucks');
const bodyParser = require('body-parser');
const history = require('connect-history-api-fallback');
// const cors = require('cors');

const app = express(); // creates an instance of an express application

// var api = require('./api');
// var models = require('./models');
// if (seedWorkouts) {
//     var generateTemplates = require('./models/generateTemplates');
// }    
let routes = require('./routes');

// var loadData = require('./data');

console.log("line 27 app.js");
// app.get('/', (req, res) => res.send('New Alloy Strength'))

app.use(bodyParser.json()); // would be for AJAX requests
app.use(bodyParser.urlencoded({ extended: true })); // for HTML form submits

app.use(session({
    secret: 'sessionSecret293',
    resave: false,
    saveUninitialized: true,    
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
}));
app.use(function (req, res, next) {
    // console.log('session', req.session);
    next();
});
// app.use('/api', api);    
app.use('/', routes);
app.use(express.static(path.join(__dirname, '..', 'views')))
app.set('view engine', 'html'); // have res.render work with html files
app.engine('html', nunjucks.render); // when giving html files to res.render, tell it to use nunjucks


nunjucks.configure('views', { noCache: true });

app.listen(process.env.PORT || 3000, function () {
    console.log('Server is listening on port 3000!');
});

// models.db.sync()
// .then(function () {
//     console.log('All tables created!');
//     app.listen(process.env.PORT || 5000, function () {
//         console.log('Server is listening on port 5000!');
//     });
// })
// .catch(console.error.bind(console));

