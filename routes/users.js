var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers=require('../helpers/user-helper');
const { log } = require('handlebars');
const { render } = require('../app');
const adminHelpers = require("../helpers/admin-helpers");

const verifyLogin=(req,res,next)=>{
  if(req.session.user){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function(req, res, next) {
  let user = req.session.user;
  let cartCount = null;

  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }

  let advertisment = await productHelpers.viewAdds(req.body);

  // Limit the number of advertisements to 3
  if (advertisment.length > 3) {
    advertisment = advertisment.slice(0, 3);
  }

  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { admin: false,products,user,advertisment,cartCount,showHeader: true
    });
  });
});


router.get('/view-all-products', async function(req,res){
  let user=req.session.user
 let products= await userHelpers.viewAllProducts(req.body)
 let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
    res.render('user/view-all-products',{showHeader:true,user,products})
})

router.get('/login',(req,res)=>{
  //ith kittila
  
 if(req.session.user){
  res.redirect('/')
 }else {
  res.render('user/login',{"loginErr":req.session.loginErr,showHeader:false})
  req.session.loginErr=false
 }
  
})
router.post('/login', async (req, res) => {
  let response = await userHelpers.doLogin(req.body);
  
  if (response.status === 'blocked') {
      req.session.loginErr = 'Your account is blocked. Please contact support.';
      res.redirect('/login');
  } else if (response.status === true) {
      req.session.user = response.user;
      req.session.loginErr = null;
      res.redirect('/');
  } else {
      req.session.loginErr = 'Invalid username or password';
      res.redirect('/login');
  }
});


router.get('/signup',(req,res)=>{
  res.render('user/signup')
})

router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
      
      if (response.status === 'active') {
          res.redirect('/login');
      } else {
          res.redirect('/'); 
      }
      console.log(response);
  })
});


  router.get('/logout',(req,res)=>{
    req.session.user=null
    req.session.user=false
    res.redirect('/')
  })

  router.get('/cart',verifyLogin,async(req,res)=>{
    let products= await userHelpers.getCartProducts(req.session.user._id)
    let totalValue=0
    if(products.length>0){
      totalValue= await userHelpers.getTotalAmount(req.session.user._id)
    }
    console.log(products)
    let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
    res.render('user/cart',{ products: products ,cartCount,user:req.session.user._id,totalValue,showHeader:true})
  })

  router.get('/add-to-cart/:id',verifyLogin,async (req,res)=>{
    console.log("api call")
   await userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true}) 
    // res.redirect('/')
    })
  })

  router.post('/change-product-quantity',(req,res,next)=>{
    console.log(req.body)
    userHelpers.changeProductQuantity(req.body).then(async(response)=>{
      response.total=await userHelpers.getTotalAmount(req.session.user._id)

      res.json(response)
    })
  })
  router.post('/remove-product',(req,res,next)=>{
    userHelpers.removeProduct(req.body).then((response)=>{
      res.json(response)
    })
  })
  router.get('/place-order',verifyLogin,async(req,res)=>{
    let total=await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/place-order',{total,user:req.session.user})
  })
  router.post('/place-order',async(req,res)=>{
    let products=await userHelpers.getCartProductList(req.body.userId)
    let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payment-method']==='cod'){
      res.json({codSuccess:true})
    }else{
        userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
          res.json(response)
        })
    }
    })
    console.log(req.body)
  })
  router.get('/order-success',(req,res)=>{
    res.render('user/order-success',{user:req.session.user._id});
  })
  router.get('/orders', verifyLogin, async (req, res) => {    
    try {
        // Fetch user-specific orders from the database
        let orders = await userHelpers.getUserOrders(req.session.user._id);
        
        // Filter out orders that have been cancelled
        const placedOrders = orders.filter(order => order.status !== 'cancelled');

        // Log the filtered orders for debugging
        console.log("*************************");
        console.log(placedOrders);
        
        let cartCount = null;
        if (req.session.user) {
            cartCount = await userHelpers.getCartCount(req.session.user._id);
        }
        
        // Render the orders page with the filtered orders
        res.render('user/orders', {  
            order: placedOrders,
            user: req.session.user._id,
            cartCount, 
            orders: placedOrders, // Passing the filtered orders for rendering
            showHeader: true
        });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).send('Internal Server Error');
    }
});

  router.get('/view-order-products/:id', async (req, res) => {
    let products = await userHelpers.getOrderProducts(req.params.id);
    let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  } 
    res.render('user/view-order-products', {user: req.session.user, products,cartCount, showHeader:true })
})

router.post('/verify-payment',(req,res)=>{
  console.log(req.body)
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
     console.log('payment success')
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err)
    res.json({status:false,errMsg:''})
  })
})
router.get('/view-each-product/:id',async(req,res)=>{
  console.log(req.params.id)
  let user=req.session.user
  let product=await userHelpers.clickOneProduct(req.params.id)

  console.log(product)
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  res.render('user/view-each-product',{cartCount,product,user,showHeader:true})
 // userHelpers.clickOneProduct().then((products)=>{

  // })
})
router.post('/blockUser', (req, res) => {
  let userId=req.body.user;
  adminHelpers.blockUser(userId).then((response)=>{
    res.json(response)
  })
})

router.post('/unBlockUser',(req,res)=>{
  let userId=req.body.user;
  adminHelpers.unBlockUser(userId).then((response)=>{
    res.json(response)
  })

})

module.exports = router;
