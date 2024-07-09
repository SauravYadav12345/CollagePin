var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require('./multer');

passport.use(new localStrategy(userModel.authenticate()));

//login page
router.get('/', function(req, res, next) {
  res.render('index', {nav: false});
});

//register page
router.get('/register', function(req, res, next) {
  res.render('register', {nav: false});
});

//Profile page
router.get('/profile', isLoggedIn, async function(req, res, next) {
  const user =
  await userModel
        .findOne({username: req.session.passport.user})
        .populate("posts")
  res.render('profile', {user, nav: true});
});

//Show Posts route
router.get('/show/posts', isLoggedIn, async function(req, res, next) {
  const user =
  await userModel
        .findOne({username: req.session.passport.user})
        .populate("posts")
  res.render('show', {user, nav: true});
});

//Feed route
router.get('/feed', isLoggedIn, async function(req, res, next) {
   const user = await userModel.findOne({username: req.session.passport.user})
   const posts = await postModel.find()
   .populate("user")

   res.render("feed", {user, posts, nav: true});
});

//Add route
router.get('/add', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render('add', {user, nav: true});
});

//CreatePost route
router.post('/createpost', isLoggedIn, upload.single("postimage"), async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile")
});


// FileUploads route
router.post('/fileupload', isLoggedIn, upload.single('image'), async  function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect('profile');
});

//register route(in this route the data will be shown)
router.post("/register", function(req, res, next){
  const data = new userModel({
    username: req.body.username,
    name: req.body.fullname,
    email: req.body.email,
    contact: req.body.contact
  });
  userModel.register( data, req.body.password)
    .then(function(registereduser){
      passport.authenticate("local")(req, res, function(){
        res.redirect("/profile")
      })
    })
});

//Login route
router.post('/login', passport.authenticate("local",{
  successRedirect: "/profile",
  failureRedirect: "/"
}), function(req, res){})

//Logout route
router.get("/logout", function(req, res, next){
  req.logout(function(err){
    if(err) {return next(err);}
    res.redirect('/');
  });
});

// isLoggedIn middleware
function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/");
}

module.exports = router;
