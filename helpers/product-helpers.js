var db = require("../config/connection");
var collection = require("../config/collections");
var { ObjectId } = require("mongodb");
module.exports = {
  addProduct: (product, callback) => {
    console.log(product);

    db.get()
      .collection("product")
      .insertOne(product)
      .then((data) => {
        callback(data.insertedId);
      });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },
  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {
      console.log(prodId);
      console.log(new ObjectId(prodId)); // Change ObjectId to new ObjectId()
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: new ObjectId(prodId) }) // Change removeOne to deleteOne
        .then((response) => {
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getProductDetails: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: new ObjectId(prodId) })
        .then((product) => {
          resolve(product);
        });
    });
  },
  updateProduct: (prodId, proDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: new ObjectId(prodId) },
          {
            $set: {
              name: proDetails.name,
              description: proDetails.description,
              price: proDetails.price,
              category: proDetails.category,
              type: proDetails.type,
              color: proDetails.color,
              material: proDetails.material,
              brand: proDetails.brand,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
};
