//basically: if not in production(not deployed) and under development
//require the dotenv

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
// require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const wrapAsync = require('./utils/wrapAsync');
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require('./models/user')
const app = express();
const mongoSanitize = require('express-mongo-sanitize'); //escapes html shit
// const helmet= require('helmet');
const dbUrl=process.env.dbUrl || 'mongodb://localhost:27017/yelpCamp';
const MongoStore = require('connect-mongo');
 

const secret=process.env.SECRET || 'thisIsMightySecret';
//touchAfter means lazy update, is in seconds, and does one in 24 hrs
//doing this so that session info is stored in db instead of on the browser
const store= MongoStore.create({
    secret,
    mongoUrl:dbUrl,
    touchAfter: 24 * 3600
    
})

store.on('error', function(e){console.log('store error', e)})
//pass this into app.use(session)
//httpOnly ascertains that from client side, if client has cross-site scripting
//their browser won't share the cookie with a a third party
//here made saveUninitialized be true bc needed the connect.sid to show up...although the docs say it has deprecated
//prior to that it wasn't showing up and t.a said bc with it being false
//cookie won't show up unless session is modified.
//instead of default connect.sid it will now appear under sesh in your browserS
//passed in store here, or could've done store:store which is the same thing as just putting in store
const sessionConfig = {
    store,
    name:'sesh',
    secret,
    //secure:true,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionConfig));
app.use(flash());
// app.use(helmet()); //for now will set that middleware to false

// const scriptSrcUrls = [
//     "https://stackpath.bootstrapcdn.com/",
//     "https://api.tiles.mapbox.com/",
//     "https://api.mapbox.com/",
//     "https://kit.fontawesome.com/",
//     "https://cdnjs.cloudflare.com/",
//     "https://cdn.jsdelivr.net",
// ];
// const styleSrcUrls = [
//     "https://kit-free.fontawesome.com/",
//     "https://stackpath.bootstrapcdn.com/",
//     "https://api.mapbox.com/",
//     "https://api.tiles.mapbox.com/",
//     "https://fonts.googleapis.com/",
//     "https://use.fontawesome.com/",
// ];
// const connectSrcUrls = [
//     "https://api.mapbox.com/",
//     "https://a.tiles.mapbox.com/",
//     "https://b.tiles.mapbox.com/",
//     "https://events.mapbox.com/",
// ];
// const fontSrcUrls = [];
// app.use(
//     helmet.contentSecurityPolicy({
//         directives: {
//             defaultSrc: [],
//             connectSrc: ["'self'", ...connectSrcUrls],
//             scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
//             styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
//             workerSrc: ["'self'", "blob:"],
//             objectSrc: [],
//             imgSrc: [
//                 "'self'",
//                 "blob:",
//                 "data:",
//                 "https://res.cloudinary.com/dwhapalef/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
//                 "https://images.unsplash.com/",
//             ],
//             fontSrc: ["'self'", ...fontSrcUrls],
//         },
//     })
// );




//passport creates and stores salt and hash
//mongoSanitize makes sure to escape html tags that can be used for xss (cross site scripting)
app.use(passport.initialize());
app.use(passport.session());
app.use(mongoSanitize({ replaceWith: '_'}));



//telling passport to use a strategy, which in this case is localStrategy
passport.use(new localStrategy(User.authenticate()));

//how to store user in a session (methods on User are from passport-local-mongoose from the schema when made)
passport.serializeUser(User.serializeUser());
//how to get user OUT of the session
passport.deserializeUser(User.deserializeUser());





//this middleware should be assigned before routes, as well as the session cookies and flash
//req.user is an object from passport stored giving the _id of user, user, and email
app.use((req, res, next) => {
    res.locals.currentUser = req.user
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error')
    return next();
})


const campgroundRoute = require('./routes/campground');
const reviewRoute = require('./routes/review');
const userRoute = require('./routes/user');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));


app.use(express.static(path.join(__dirname, '/public')));
app.use('/campgrounds', campgroundRoute);
app.use('/campgrounds/:id', reviewRoute);
app.use('/', userRoute);

//connects it to db
mongoose.connect('mongodb://localhost:27017/yelpCamp')
//mongoose.connect(dbUrl);


app.get('/', (req, res) => {
    res.render('home');
});


//error handler for all pages that dne
//hits this first, and in the main error handler is used for res.status and res.send
app.all('*', (req, res, next) => {
    next(new ExpressError('Page not found', 404));
})

//changed const{status=500, message='Something went wrong'}=err bc assigned a default to variable message and that wouldnt
//be used in the object were utilizing in the error.ejs file
app.use((err, req, res, next) => {
    const { status = 500 } = err;
    if (!err.message) err.message = 'ERROR';
    res.status(status).render('campgrounds/error', { err });
})

const port= process.env.PORT || 3000
app.listen(port, () => { console.log(`PORT ${port} OPEN`) });
