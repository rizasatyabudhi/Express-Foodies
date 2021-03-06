const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: 'Please Enter Store Name!',
    },
    slug: String,
    description: {
      type: String,
      trim: true,
    },
    tags: [String],
    created: {
      type: Date,
      default: Date.now(),
    },
    location: {
      type: {
        type: String,
        default: 'Point',
      },
      coordinates: [
        {
          type: Number,
          required: 'You must supply coordinates',
        },
      ],
      address: {
        type: String,
        required: 'You must supply an address',
      },
    },
    photo: String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: 'You must supply an author!',
    },
  }
  // this is to POPULATE the virtual field into the returned data
  , {
    toJSON: { virtual: true },
    toObject: { virtual: true },
  },
);

// Define index
// we want to index field that will be able to be searched
storeSchema.index({
  name: 'text',
  description: 'text',
});

storeSchema.index({ location: '2dsphere' });

storeSchema.pre('save', async function (next) {
  if (!this.isModified('name')) {
    next();
    return;
  }
  this.slug = slug(this.name);
  // find other stores that have a slug of riza,riza-1,riza2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
});

// this is to bind "getTagsList" to our model, so it have this method
// must use function(), so "this" will bind to our Store model
storeSchema.statics.getTagsList = function () {
  return this.aggregate([
    // each tag in Store will be split (store will be duplicated)
    { $unwind: '$tags' },
    // group them by tags, and give another field which is count
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

storeSchema.virtual('reviews', { // name of virtual field to be created in Store
  ref: 'Review', // which model ?
  localField: '_id', // which field on our "Store" model should be matched with foreignField?
  foreignField: 'store', // which field on our "Review" model ?
});

module.exports = mongoose.model('Store', storeSchema);
