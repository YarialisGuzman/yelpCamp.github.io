const Review = require('../models/review');
const Campground = require('../models/campground');

//creating a review
//note that in show page for this form the names are: review[body] and review[rating] and basically this stores both as an object under review
//also rememb that the req.body refers to what is submitted to it from the review form in the show page
//rememb that post page is same as the page set for the action of a form+
//the middleware of validateReviewJoiSchema is to make sure everything necessary is there
//check out the form over at show.ejs
//can check out if this works by taking a campground, addind /reviews and testing the body urlenconded with doing only one:review[body] hey
module.exports.postReview = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', `Review has been added`)
    res.redirect(`/campgrounds/${campground._id}`);

};


//see where you do Campground.findByIdAndUpdate, we are using a mongo operator called pull, that 
//removes all the instances of the value or the value that matches the specified condition from the existing array.
//and that's bc if you check the campgroundSchema has reviews as an array of objects, that would host the reviewIds
module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', `Review Deleted`)
    res.redirect(`/campgrounds/${id}`);
};