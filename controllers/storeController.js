const Store = require('../models/Store');
const multer = require('multer'); // For image upload
const jimp = require('jimp'); // For image compress
const uuid = require('uuid');

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

exports.homePage = (req, res) => {
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
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
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  next();
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
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
  const store = await Store.findOne({ slug: req.params.slug }).populate('author');
  // res.render("store", store);
  res.render('store', { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  const { tag } = req.params; // to get what tag is currently opened
  const tagQuery = tag || { $exists: true }; // if "tag" is not present, query all data that has "tag"
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  // we want 2 query at the same time, we use await and Promise.all
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tag', {
    tags, title: 'Tags', tag, stores,
  });
};
