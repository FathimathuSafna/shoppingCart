var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers=require('../helpers/user-helper');
const { log } = require('handlebars');
const { render } = require('../app');
var userHeader=require('../views/partials/user-header')
var showHeader=true
const verifyLogin=(req,res,next)=>{
  if(req.session.user.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',async function(req, res, next) {

  let user=req.session.user
  console.log(user)
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }

  productHelpers.getAllProducts().then((products)=>{
      res.render('user/view-products',{admin:false,products,user,cartCount,showHeader:true})
    
    
    })
  // res.render('index', {products,admin:false});
});
router.get('/login',(req,res)=>{

  //ith kittila
 if(req.session.user){
  res.redirect('/')
 }else {
  res.render('user/login',{"loginErr":req.session.loginErr,showHeader:false})
  req.session.loginErr=false
 }
  
})

router.get('/signup',(req,res)=>{
  res.render('user/signup')
})

router.post('/signup',(req,res)=>{
 userHelpers.doSignup(req.body).then((response)=>{
  console.log(response)
  req.session.user=response
  req.session.user.loggedIn=true
  res.redirect('/')
 })
})


  router.post('/login', (req, res) => {
    userHelpers.doLogin(req.body).then((response)=>{
      if(response.status){

        req.session.user=response.user
        req.session.user.loggedIn=true
        res.redirect('/')
      }else{
        req.session.user.loginErroginErr="invalid email or password"
        res.redirect('/login')
      }
      
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
    res.render('user/cart',{ products: products ,user:req.session.user._id,totalValue,showHeader:true})
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
    res.render('user/order-success',{user:req.session.user})
  })
  router.get('/orders', async (req, res) => {
    let orders = await userHelpers.getUserOrders(req.session.user._id);
    res.render('user/orders', { user: req.session.user, orders,showHeader:true});
});

  router.get('/view-order-products/:id', async (req, res) => {
    let products = await userHelpers.getOrderProducts(req.params.id); 
    res.render('user/view-order-products', { user: req.session.user, products })
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
module.exports = router;
