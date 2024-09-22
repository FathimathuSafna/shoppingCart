var express = require("express");
const { render } = require("../app");
var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const adminHelpers = require("../helpers/admin-helpers");
const { log } = require('handlebars');
const userHelper = require("../helpers/user-helper");

const verifyLogins=(req,res,next)=>{
  if(req.session.admin){
    next()
  }else{
    res.redirect('/admin/admin-login')
  }
}
/* GET users listing. */
router.get("/",verifyLogins, async function (req, res, next) {
  try {
    let userCount = await adminHelpers.getusercount();  // Fetch user count
    let orderCount = await adminHelpers.getOrderCount(); 
    let productCount = await adminHelpers.getproductcount(); 
    let pendingOrderCount = await adminHelpers.getPendingOrderCount();
    let admins = req.session.admin;
    
    // Fetch users info and prepare the data
    adminHelpers.usersInfo().then((user) => {
      const preparedUsers = user.map(user => ({
        ...user,
        isActive: user.status === 'active'  // Determine if the user is active
      }));

      // Render the view with the user data and admin info
      res.render("admin/view-products", { user: preparedUsers,admin: true, admins,userCount,orderCount,productCount,pendingOrderCount   // Pass the user count to the view
      });
    });
  } catch (error) {
    next(error);  // Handle errors if any
  }
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

  router.get('/admin-logout', (req, res) => {
    // Perform any necessary logout logic here, like clearing session
    req.session.destroy(err => {
      if (err) {
        return res.redirect('/admin'); // or handle error appropriately
      }
      res.redirect('/admin/admin-login');
    });
  });
  router.get('/addPage',(req,res)=>{
    let admins=req.session.admin
    res.render("admin/addPage",{admin:true,admins})
  })    
    router.post('/addPage', (req, res) => {
    console.log("#############################");
    let product=  productHelpers.adds(req.body,(insertedId)=>{
        console.log(req.body)
      let image = req.files.Image;
      console.log(insertedId)

    image.mv("./public/images/" + insertedId + ".jpg", (err, done) => {
      if (!err) {
        let admins = req.session.admin;
        res.redirect("/admin/addPage",{admin:true,admins});
      } else {
        console.log(err);
      }
    });
  })
})

router.get('/showAdd',async function(req,res){
  let admins=req.session.admin
  let advertisment=await productHelpers.viewAdds(req.body)
  res.render('admin/showAdd',{advertisment,admin:true,admins})
  
})
// Route to display the edit form
router.get('/editAdd/:id', async (req, res) => {
  try {
    let admins=req.session.admin
      let product = await productHelpers.viewExistingAdd(req.params.id);
      res.render('admin/editAdd', { product, admin: true ,admins});
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
                  res.redirect("/admin/showAdd",{admins}); // Redirect to the show add page if the image is updated
              }
          });
      } else {
          res.redirect("/admin/editAdd/" + id,{admins}); // Redirect back to the edit page if there's no image to move
      }
  }).catch((err) => {
      console.error("Failed to update advertisement:", err);
      res.status(500).send("Error updating advertisement."); // Send an error response
  });
});

 
  
router.get("/view-admin-product",(req,res)=>{
  let admins=req.session.admin
  productHelpers.getAllProducts().then((products) => {
    console.log(products)
  res.render("admin/view-adminproducts",{products,admin:true,admins})
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
  let admins=req.session.admin
  res.render("admin/add-product",{admin:true ,admins});
});

router.post("/add-product", (req, res) => {
  productHelpers.addProduct(req.body, (insertedId) => {
    let image = req.files.Image;
    console.log(insertedId);
    image.mv("./public/images/" + insertedId + ".png", (err, done) => {
      if (!err) {
        res.render("admin/add-product",{admins});
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
    res.redirect("/admin/view-admin-product",{admins});
  });
});
router.get("/deleteAdd/:id", (req, res) => {
  let proId = req.params.id;
  console.log(proId);
  productHelpers.deleteAdd(proId).then((response) => {
    res.redirect("/admin/showAdd",{admins});
  });
});
router.get("/edit-product/:id", async (req, res) => {
  let admins=req.session.admin
  let product = await productHelpers.getProductDetails(req.params.id);
  console.log(product);
  res.render("admin/edit-product", { product ,admin:true,admins});
})

router.post("/edit-product/:id", (req, res) => {
  let id = req.params.id;
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect("/admin",{admins});
    if (req.files.Image) {
      let image = req.files.Image;
      image.mv("./public/images/" + id + ".png");
    }
  });
})
router.get('/pending-orders', async (req, res) => {
  try {
    let admins=req.session.admin
      // Assuming you want to fetch orders for all users or a specific set of userIds
      const userIds = []; // Add user IDs here if needed, or leave it empty for all orders
      
      // Fetch all orders from the database
      const orders = await adminHelpers.getOrders(userIds);
      
      // Filter orders to include only those with a status of 'pending'
      const pendingOrders = orders.filter(order => order.status === 'pending');
      
      res.render('admin/pending-orders', { orders: pendingOrders ,admin:true,admins});
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
})
router.post('/orderPlaced', (req, res) => {
  console.log(req.body);  // Log the request body to check if orderId is received correctly
  let orderId = req.body.orderId;  // Use the correct key to get the orderId
  adminHelpers.orderPlaced(orderId).then((response) => {
      res.json(response);
  }).catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
  });
});
router.get('/placed-orders',async(req,res)=>{
  try {
    let admins=req.session.admin
    // Assuming you want to fetch orders for all users or a specific set of userIds
    const userIds = []; // Add user IDs here if needed, or leave it empty for all orders
    
    // Fetch all orders from the database
    const orders = await adminHelpers.getOrders(userIds);
    
    // Filter orders to include only those with a status of 'pending'
    const placedOrders = orders.filter(order => order.status === 'placed');
    
    res.render('admin/placed-orders', { orders: placedOrders,admin:true,admins });
} catch (error) {
    console.error(error);
    res.status(500).send('Server error');
}
})
router.post('/inProgress', (req, res) => {
  console.log(req.body);  // Log the request body to check if orderId is received correctly
  let orderId = req.body.orderId;  // Use the correct key to get the orderId
  adminHelpers.orderProgress(orderId).then((response) => {
      res.json(response);
  }).catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
  });
})
router.get('/in-progress-orders',async(req,res)=>{
  try {
    let admins=req.session.admin
    // Assuming you want to fetch orders for all users or a specific set of userIds
    const userIds = []; // Add user IDs here if needed, or leave it empty for all orders
    
    // Fetch all orders from the database
    const orders = await adminHelpers.getOrders(userIds);
    
    // Filter orders to include only those with a status of 'pending'
    const placedOrders = orders.filter(order => order.status === 'inProgress');
    
    res.render('admin/in-progress-orders', { orders: placedOrders,admin:true,admins });
} catch (error) {
    console.error(error);
    res.status(500).send('Server error');
}
})
router.post('/delivered', (req, res) => {
  console.log(req.body);  // Log the request body to check if orderId is received correctly
  let orderId = req.body.orderId;  // Use the correct key to get the orderId
  adminHelpers.deliveredOrder(orderId).then((response) => {
      res.json(response);
  }).catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
  });
})
router.get('/delivered-orders',async(req,res)=>{
  try {
    let admins=req.session.admin
    // Assuming you want to fetch orders for all users or a specific set of userIds
    const userIds = []; // Add user IDs here if needed, or leave it empty for all orders
    
    // Fetch all orders from the database
    const orders = await adminHelpers.getOrders(userIds);
    
    // Filter orders to include only those with a status of 'pending'
    const placedOrders = orders.filter(order => order.status === 'delivered');
    
    res.render('admin/delivered-orders', { orders: placedOrders ,admin:true,admins});
} catch (error) {
    console.error(error);
    res.status(500).send('Server error');
}
})
router.post('/cancel', (req, res) => {
  console.log(req.body);  // Log the request body to check if orderId is received correctly
  let orderId = req.body.orderId;  // Use the correct key to get the orderId
  adminHelpers.cancelled(orderId).then((response) => {
      res.json(response);
  }).catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
  });
})
router.get('/cancelled-orders',async(req,res)=>{
  try {
    let admins=req.session.admin
    // Assuming you want to fetch orders for all users or a specific set of userIds
    const userIds = []; // Add user IDs here if needed, or leave it empty for all orders
    
    // Fetch all orders from the database
    const orders = await adminHelpers.getOrders(userIds);
    
    // Filter orders to include only those with a status of 'pending'
    const placedOrders = orders.filter(order => order.status === 'cancelled');
    
    res.render('admin/cancelled-orders', { orders: placedOrders,admin:true ,admins});
} catch (error) {
    console.error(error);
    res.status(500).send('Server error');
}
})

module.exports = router;
