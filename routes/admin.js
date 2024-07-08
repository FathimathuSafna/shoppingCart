var express = require("express");
const { render } = require("../app");
var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const adminHelpers = require("../helpers/admin-helpers");
const { log } = require('handlebars');

/* GET users listing. */
router.get("/", function (req, res, next) {
  // productHelpers.getAllProducts().then((products) => {
  //   res.render("admin/view-products", { admin: true, products });
  // });
  adminHelpers.usersInfo().then((user)=>{
    res.render("admin/view-products",{admin:true,user})
  })

});

router.get("/view-admin-products",function(req,res){
  productHelpers.getAllProducts().then((products) => {
    console.log(products)
  res.render("admin/view-admin-products",{products})
})
})

// router.get("/all-users", (req,res) =>{
//  adminHelpers.usersInfo().then((user)=>{
//   res.render("admin/all-users",{user})
//  })
 
// })

router.get("/add-product", (req, res) => {
  res.render("admin/add-product");
});

router.post("/add-product", (req, res) => {
  productHelpers.addProduct(req.body, (insertedId) => {
    let image = req.files.Image;
    console.log(insertedId);
    image.mv("./public/images/" + insertedId + ".png", (err, done) => {
      if (!err) {
        res.render("admin/add-product");
      } else {
        console.log(err);
      }
    });
  });
});
router.get("/delete-product/:id", (req, res) => {
  let proId = req.params.id;
  console.log(proId);
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect("/admin/");
  });
});
router.get("/edit-product/:id", async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id);
  console.log(product);
  res.render("admin/edit-product", { product });
});
router.post("/edit-product/:id", (req, res) => {
  let id = req.params.id;
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect("/admin");
    if (req.files.Image) {
      let image = req.files.Image;
      image.mv("./public/images/" + id + ".png");
    }
  });
});



module.exports = router;
