const Campground = require('./models/campground');
const Review = require('./models/review');
const ExpressError = require('./utils/ExpressError');
const { campgroundSchema, reviewSchema } = require('./joiSchemas');

//passport adds the isAuthenticated to the req object
//states if user isn't authenticated:do this
//we're storing the page the user wanted to go to under req.session so that
//after they're redirected to the login page, they can login, and thennn be taken back to the page 
//they originally wanted to go to
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', `You need to be logged in`);
        return res.redirect('/login');
    } else {
        return next();
    }
}

//this is middleware bc of the three params
module.exports.validateCampJoiSchema = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(element => element.message).join(',');
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateReviewJoiSchema = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(element => element.message).join(',');
        throw new ExpressError(msg, 404);
    }
    else {
        return next();
    }
}


module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', `You don't have permission to do this`);
        return res.redirect(`/campgrounds/${id}`);
    }
    return next();
}

//rememb that review.author is the id of the review author as set in the model of reviews
module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', `You don't have permission to do that`);
        return res.redirect(`/campgrounds/${id}`);
    }
    return next();
}