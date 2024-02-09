const mongoose = require('mongoose');
const { Schema } = mongoose;

//gonna to one to many relationship where each campground stores the id of its associated reviews
const reviewSchema = new Schema({
    body: String,
    rating: Number,
    author: { type: Schema.Types.ObjectId, ref: 'User' }
})

// const Review=mongoose.model('Review', reviewSchema);

// module.exports=Review;

module.exports = mongoose.model('Review', reviewSchema);
