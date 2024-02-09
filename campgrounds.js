const Campground = require('../models/campground');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.mapBoxToken; //taken from .env file
const geocoder = mbxGeocoding({ accessToken: mapBoxToken }); //has both forward and reverse geocoding available
const { cloudinary } = require('../cloudinary'); //don't have to specify index since module.exports works on index

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/allCamps', { campgrounds })
}

module.exports.newForm = (req, res) => {
    const campground = new Campground(req.body.campground);
    res.render('campgrounds/new', { campground });
}


//two things: when redirect only need the page, and number two, the new.ejs form should have action be same as the post '/campgrounds'
//notice we can throw the new ExpressError, and that's bc wrapAsync will catch it and stop the code there (without having to do the whole return next(error))
//-tried sending only the title via postman in the body and got hit with the below error! So it works! Now we're stopping other errors
//had to console.log my way through this one. bc the error was an array within an object we had to map over it, and extract/return the message for each element
//pro-tip: console.log sis.s
//remember that req.files serves for img uploads
//what we get from geoData is a json formatted object which has the type of point and coordinates
//mongoose helps us to set up the type of point and coordinates as array of nums in campground model
//mongoose follows geoJSON pattern exactly like what the geocoder returns
module.exports.createNewCampground = async (req, res, next) => {
    // if (!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.author = req.user._id;
    campground.imgs = req.files.map(file => ({ url: file.path, filename: file.filename })); //to make implicit returns did parenthesis around curly braces

    await campground.save();
    console.log(campground)
    req.flash('success', 'You have successfully added a campground.');
    res.redirect(`/campgrounds/${campground._id}`);

}

//for line of path, and review (below const campground), here we're populating the reviews, as well
//as the author object under each review, which is why we set it up that way
//the last author we populate references the author of the campground, so they're both diff
module.exports.showCampground = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id).populate(
        { path: 'reviews', populate: { path: 'author' } }
    ).populate('author');
    if (!campground) {
        req.flash('error', `Campground doesn't exist`);
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
}

//for some reason you can't access currentUser from here...just something curious
module.exports.editForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', `Campground doesn't exist`);
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
}

//says that when use edit form, if req.body.deleteImgs empty array gains elements, or has, that indicates the person
//editing wants to delete them, so we take the selected campground, pull from the .imgs property ones that have
//the filenames equivalent to those within the array of req.body.deleteImgs (this deletes it from mongodb)
module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map(file => ({ url: file.path, filename: file.filename })); //rememb this creates an array and we set up implicit return
    campground.imgs.push(...imgs); //here spread the array of imgs that way we don't push an array into an array, and instead push in individual imgs into the array of imgs
    if (req.body.deleteImgs) {
        for (let filename of req.body.deleteImgs) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { imgs: { filename: { $in: req.body.deleteImgs } } } })
    }
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Campground deleted');
    res.redirect('/campgrounds');
}