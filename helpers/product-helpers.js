var db = require("../config/connection");
var collection = require("../config/collections");
var { ObjectId } = require("mongodb");
module.exports = {
  addProduct: (product, callback) => {
    console.log(product);

    db.get().collection("product").insertOne(product).then((data) => {
        callback(data.insertedId);
      });
  },
  adds: (page, callback) => { 
   db.get().collection(collection.ADD_COLLECTION).insertOne(page).then((data)=> {          
      callback(data.insertedId);  // Pass the insertedId to the callback        
      })    
  }, 
  viewAdds:()=>{
    return new Promise(async(resolve,reject)=>{
      let advertisment=await db.get().collection(collection.ADD_COLLECTION).find().toArray()
      resolve(advertisment)
    })
  },
  viewExistingAdd:(addId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.ADD_COLLECTION).findOne({_id:new ObjectId(addId)})
      .then((product)=>{
        resolve(product)
      })
    })
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray();
      resolve(products);
    });
  },
  getTrendingProduct:()=>{
    return new Promise((resolve,reject)=>{
      let TrendingProduct= db.get().collection(collection.PRODUCT_COLLECTION).find({"category" : "trending"}).toArray()
      resolve(TrendingProduct)
    })
  },
  getBestsellers:()=>{
    return new Promise((resolve,reject)=>{
      let Bestsellers= db.get().collection(collection.PRODUCT_COLLECTION).find({"category" : "bestSeller"}).toArray()
      resolve(Bestsellers)
    })
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
  deleteAdd: (prodId) => {
    return new Promise((resolve, reject) => {
      console.log(prodId);
      console.log(new ObjectId(prodId)); // Change ObjectId to new ObjectId()
      db.get()
        .collection(collection.ADD_COLLECTION)
        .deleteOne({ _id: new ObjectId(prodId) }) // Change removeOne to deleteOne
        .then((response) => {
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
   updateAdd:(prodId, updatedData) => {
    return new Promise((resolve, reject) => {
        db.get().collection(collection.ADD_COLLECTION).updateOne(
            { _id: new ObjectId(prodId) },  // Filter to find the document by ID
            { $set: updatedData }  // Update operation to set the new values
        ).then((response) => {
            resolve(response);  // Resolve with the response from MongoDB
        }).catch((error) => {
            reject(error);  // Reject the promise if an error occurs
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
