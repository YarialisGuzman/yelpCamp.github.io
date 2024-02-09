const User = require('../models/user');

module.exports.renderRegister = (req, res) => {
    res.render('users/register');
}


//req.login requires the registered user, and an error call back which is why 
//we sent it to our errorhandler
module.exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, (e) => {
            if (e) return next(e);
            req.flash('success', `Welcome to yelpCamp`);
            res.redirect('/campgrounds');
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
};

//first chooses the local strategy, then it flashes a message if something goes wrong,
//and ultimately we want it to redirect to same login page
module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

//couple of things: redirect url says if req.session.returnTo exist, use that, if not, use /campgrounds
//if there is req.session.returnTo, we delete that off our session so it doesn't remain
//done under post method of login because we take the information from the login form, and 
//use that to go right back to where you wanted to originally go. And if you didn't wanna go anywhere and you were
//never forced to signin, there'll be no req.session.returnto and you will be redirected to /campgrounds
module.exports.loginToBeAuthorized = (req, res) => {
    req.flash('success', 'Welcome back!');
    const redirectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
};

//req.logout is put there by passport on the req object
module.exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'Logged out');
    res.redirect('/campgrounds');
}