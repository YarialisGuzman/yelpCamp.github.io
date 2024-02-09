const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;


const ImgSchema = new Schema({
    url: String,
    filename: String
})

//rememb virtuals aren't stored, and the this refers to every instance of an image
ImgSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_150');
})

const opts = { toJSON: { virtuals: true } }; //so that in clusterMap.js virtuals are used (bc campgrounds is in json stringified there)

const CampgroundSchema = new Schema({
    title: String,
    price: Number,
    description: String,
    imgs: [ImgSchema],
    location: String,
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    reviews: [
        { type: Schema.Types.ObjectId, ref: 'Review' }
    ],
    author:
        { type: Schema.Types.ObjectId, ref: 'User' }
}, opts)

//the this refers to every instance of a campground (before had campground._id and that messed everything up)
CampgroundSchema.virtual('properties.popUpText').get(function () { return `<a href="/campgrounds/${this._id}">${this.title}</a>`})

//rememb that these are defined before the model
//so if there is a document (which would be the object of the campground itself (with the reviews either as an empty array or filled))
//you will thereby end up deleting all the reviews that have an id within the array of the doc.reviews, aka, all of the
//related reviews to the campground
//rememb that we use the post instead of the pre middleware because it has access to the data unlike in pre
CampgroundSchema.post('findOneAndDelete', async function (doc) {
    try {
        if (doc) {

            await Review.deleteMany({
                _id: {
                    $in: doc.reviews
                }
            })
        }
    } catch (e) {
        console.log(e);
    }


})

module.exports = mongoose.model('Campground', CampgroundSchema)
