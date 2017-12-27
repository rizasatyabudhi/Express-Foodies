const Store = require("../models/Store");

exports.homePage = (req, res) => {
  res.render("index");
};

exports.addStore = (req, res) => {
  res.render("editStore", { title: "Add Store" });
};

exports.createStore = async (req, res) => {
  const store = await new Store(req.body).save();
  req.flash(
    "success",
    `successfully created ${store.name}. Care to leave a Review?`
  );
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const stores = await Store.find();
  res.render("stores", { title: "Stores", stores });
};

exports.editStore = async (req, res) => {
  // 1. find store given the id
  const store = await Store.findOne({ _id: req.params.id });
  // 2. confirm they are the owner of the store
  res.render("editStore", { title: `Edit ${store.name}`, store });

  // 3. render out the edit form so user can update
};

exports.updateStore = async (req, res) => {
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the updated store instead of the old one,
    runValidators: true
  }).exec();
  req.flash(
    "success",
    `Successfully updated ${store.name}. <a href="/stores/${
      store.slug
    }">View Store</a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
};
