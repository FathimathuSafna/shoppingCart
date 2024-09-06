var express = require("express");
const { render } = require("../app");
var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const adminHelpers = require("../helpers/admin-helpers");
const { log } = require('handlebars');

const verifyLogin=(req,res,next)=>{
  if(req.session.admin){
    next()
  }else{
    res.redirect('/admin-login')
  }
}
/* GET users listing. */
router.get("/", function (req, res, next) {
  // productHelpers.getAllProducts().then((products) => {
  //   res.render("admin/view-products", { admin: true, products });
  // });
  let admins=req.session.admin
    adminHelpers.usersInfo().then((user)=>{
    const preparedUsers = user.map(user => ({
      ...user,
      isActive: user.status === 'active'
  }));
  
    res.render("admin/view-products",{user:preparedUsers,admin:true,admins})
  })

});
router.get('/admin-login',(req,res)=>{
    if(req.session.admin){
      
      res.redirect('/admin')
    }else{
  res.render("admin/admin-login")
    }
})

router.post('/admin-login', async (req, res) => {
  let response = await adminHelpers.adminLogin(req.body);
   if (response.status === true) {
      req.session.admin = response.admin;
      req.session.loginErr = null;
      res.redirect('/admin');
  } else {
      req.session.loginErr = 'Invalid username or password';
      res.redirect('/admin/admin-login');
  }
});

router.get('/admin-signup',(req,res)=>{
    res.render("admin/admin-signup")
  })

  router.post('/admin-signup',(req,res)=>{
 adminHelpers.adminSignup(req.body).then((response)=>{
if(response.status === 'active'){
  res.redirect('/admin/admin-login')
} else{
  res.redirect("/admin")
}
  console.log(response)
 })
  })
  router.get('/addPage',(req,res)=>{
    res.render("admin/addPage",{admin:true})
  })    
    router.post('/addPage', (req, res) => {
    console.log("#############################");
    let product=  productHelpers.adds(req.body,(insertedId)=>{
        console.log(req.body)
      let image = req.files.Image;
      console.log(insertedId)

    image.mv("./public/images/" + insertedId + ".jpg", (err, done) => {
      if (!err) {
        res.redirect("/admin/addPage");
      } else {
        console.log(err);
      }
    });
  })
})

router.get('/showAdd',async function(req,res){
  let advertisment=await productHelpers.viewAdds(req.body)
  const ads = await productHelpers.viewAdds(); // Assuming viewAdds fetches the ads from the database
  const adCount = ads.length;
  res.render('admin/showAdd',{advertisment,admin:true,adCount: adCount})
  
})
// Route to display the edit form
router.get('/editAdd/:id', async (req, res) => {
  try {
      let product = await productHelpers.viewExistingAdd(req.params.id);
      res.render('admin/editAdd', { product, admin: true });
  } catch (err) {
      console.error('Error fetching product:', err);
      res.redirect('/admin'); // Redirect to the admin page if there's an error
  }
});

// Route to handle the form submission
router.post("/editAdd/:id", (req, res) => {
  let id = req.params.id;

  productHelpers.updateAdd(id, req.body).then(() => {
      if (req.files && req.files.Image) {
          let image = req.files.Image;
          image.mv("./public/images/" + id + ".jpg", (err) => {
              if (err) {
                  console.error("Failed to move image file:", err);
                  res.status(500).send("Error updating advertisement.");
              } else {
                  res.redirect("/admin/showAdd"); // Redirect to the show add page if the image is updated
              }
          });
      } else {
          res.redirect("/admin/editAdd/" + id); // Redirect back to the edit page if there's no image to move
      }
  }).catch((err) => {
      console.error("Failed to update advertisement:", err);
      res.status(500).send("Error updating advertisement."); // Send an error response
  });
});

 
  
router.get("/view-admin-product",(req,res)=>{
  productHelpers.getAllProducts().then((products) => {
    console.log(products)
  res.render("admin/view-adminproducts",{products,admin:true})
})
})

// router.get("/view-admin-product",(req,res)=>{
//   res.render("admin/view-adminproducts")
// })

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
router.get("/deleteAdd/:id", (req, res) => {
  let proId = req.params.id;
  console.log(proId);
  productHelpers.deleteAdd(proId).then((response) => {
    res.redirect("/admin/showAdd");
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
