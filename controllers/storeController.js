const mongoose = require('mongoose');

const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer'); // For image upload
const jimp = require('jimp'); // For image compress
const uuid = require('uuid');

exports.homePage = (req, res) => {
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};


// for image upload
const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That file type is not allowed!' }, false);
    }
  },
};

exports.upload = multer(multerOptions).single('photo');
exports.resize = async (req, res, next) => {
  // the image uploaded from multer will be sent to "file" property
  if (!req.file) {
    next();
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize with "jimp"
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  next();
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id; // assign the currently logged in as the author of store
  const store = await new Store(req.body).save();
  req.flash(
    'success',
    `successfully created ${store.name}. Care to leave a Review?`,
  );
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
};

// protecting routes
const confirmOwner = (store, user) => {
  // we compare the author id that is in the Store model, with the id in current user
  if (!store.author.equals(user._id)) {
    throw Error('You must own the store in order to edit it');
  }
};

exports.editStore = async (req, res) => {
  // 1. find store given the id
  const store = await Store.findOne({ _id: req.params.id });
  // 2. confirm they are the owner of the store
  confirmOwner(store, req.user);
  // 3. render out the edit form so user can update
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // set the location data to be a point
  req.body.location.type = 'Point';
  // find and update store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the updated store instead of the old one,
    runValidators: true,
  }).exec();
  req.flash(
    'success',
    `Successfully updated ${store.name}. <a href="/stores/${
      store.slug
    }">View Store</a>`,
  );
  res.redirect(`/stores/${store._id}/edit`);
};

exports.getStore = async (req, res) => {
  // populate the "author" field in Store
  const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
  // res.render("store", store);
  res.render('store', { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  const { tag } = req.params; // to get what tag is currently opened
  const tagQuery = tag || { $exists: true }; // if "tag" is not present, query all data that has "tag"
  const tagsPromise = Store.getTagsList(); // getTagsList() is defined in Store.js (model)
  const storesPromise = Store.find({ tags: tagQuery });
  // we want 2 query at the same time, we use await and Promise.all
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tag', {
    tags, title: 'Tags', tag, stores,
  });
};


// API //
// search query
exports.searchStore = async (req, res) => {
  const stores = await Store
    .find({
      // we find using the index (remember that we set the index type to text)
      $text: {
        $search: req.query.q,
      },
    }, {
      // make a new field of "score"
      score: { $meta: 'textScore' },
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(5);

  res.json(stores);
};


exports.mapStores = async (req, res) => {
  // lng FIRST, then lat
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      // $near will search for store location that are near the given latlong
      $near: {
        $geometry: {
          type: 'Point',
          coordinates,
        },
        $maxDistance: 10000, // 10000 meter | 10km
      },
    },
  };
  const stores = await Store.find(q).select('slug name description location photo').limit(10);
  res.json(stores);
};


exports.mapPage = async (req, res) => {
  res.render('map', { title: 'Map' });
};


exports.heartStore = async (req, res) => {
  // convert the array of object in "hearts" field into a string, because it is actually an object
  const hearts = req.user.hearts.map(obj => obj.toString());
  // if hearts in DB includes the id of hearts from the parameter,
  // remove the heart in the DB ($pull) , else add the heart param to the DB ($addToSet)
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { [operator]: { hearts: req.params.id } },
    { new: true }, // we need to return the newly updated user
  );
  res.json(user);
};

exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    // find the store id that is in the user's hearts array
    _id: { $in: req.user.hearts },
  });
  res.render('stores', { title: 'Hearted Stores', stores });
};
