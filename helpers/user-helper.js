var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
var {ObjectId}=require('mongodb')
const { response } = require('../app')
const Razorpay=require('razorpay')

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{

     userData.password=await bcrypt.hash(userData.password,10)
       db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
        
        resolve({
            name: userData.name,
            email: userData.email,
            password: userData.password,
            insertedId: data.insertedId
        })
       })

        })
       
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            if(user){
                bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status){
                        console.log("login success")
                        response.user=user
                        response.status=true
                        resolve(response)
                    } else {
                        console.log("login failed")
                        resolve({status:false})
                    }
                    
                })
            } else {
                console.log('login failed')
                resolve({status:false})
            }
        })
    },
    addToCart: (prodId, userId) => {
        let proObj = {
            item: new ObjectId(prodId),
            quantity: 1
        };
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) });
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item.equals(new ObjectId(prodId)));
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ 'products.item': new ObjectId(prodId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        })
                        .then(() => {
                            resolve();
                        })
                        .catch(error => {
                            reject(error);
                        });
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: new ObjectId(userId) },
                        {
                            $push: { products: proObj }
                        })
                        .then(() => {
                            resolve();
                        })
                        .catch(error => {
                            reject(error);
                        });
                }
            } else {
                let cartObj = {
                    user: new ObjectId(userId),
                    products: [proObj]
                };
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj)
                    .then(() => {
                        resolve();
                    })
                    .catch(error => {
                        reject(error);
                    });
            }
        });
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:new ObjectId(userId)}
                },{
                    $unwind:'$products'
                },{
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },{
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'

                    }
                },
                {
                    $project:{
                        item:1, quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
           let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user: new ObjectId(userId)})
            if(cart){
                count=cart.products.length
            }
            resolve(count)
        })
    },
    
    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
       
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:new ObjectId (details.cart)},
            {
                $pull:{products:{item: new ObjectId(details.product)}}
            }).then((response)=>{
                resolve({removeProduct:true})
            })
            }else{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:new ObjectId(details.cart),'products.item':new ObjectId(details.product)},
            {
                $inc:{'products.$.quantity':details.count}
            }).then((response)=>{
                resolve({status:true})
            })
        }

        })
    },
    removeProduct: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne(
                { _id: new ObjectId(details.cart) },
                {
                    $pull: { products: { item: new ObjectId(details.product) } }
                }
            ).then((response) => {
                resolve({ removeProduct: true });
            }).catch((error) => {
                reject(error);
            });
        });
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: new ObjectId(userId) }
                    }, {
                        $unwind: '$products'
                    }, {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    }, {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    }, {
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    }, {
                        $addFields: {
                            priceNumeric: { $toDouble: "$product.price" }
                        }
                    }, {
                        $group: {
                            _id: null,
                            total: { $sum: { $multiply: ['$quantity', '$priceNumeric'] } }
                        }
                    }
                ]).toArray();
    
                if (total && total.length > 0 && total[0].total !== undefined) {
                    console.log(total[0].total);
                    resolve(total[0].total);
                } else {
                    console.log("No total found");
                    resolve(0); // or handle this case accordingly
                }
            } catch (error) {
                console.error("Error in calculating total:", error);
                reject(error);
            }
        });
    },
 placeOrder:(order,products,total)=>{
    return new Promise((resolve,reject)=>{
         console.log(order,products,total)
         let status=order['payment-method']==='cod'?'placed':'pending'
         let orderObj={
            deliveryDetails:{
                mobile:order.mobile,
                address:order.address,
                pincode:order.pincode  
            },
            userId:  new ObjectId(order.userId),
            paymentMethod:order['payment-method'],
            products:products,
            totalAmount:total,
            status:status,
            date:new Date()
         }
         db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
           db.get().collection(collection.CART_COLLECTION).deleteOne({user:new ObjectId(order.userId)})
            resolve(response.insertedId)
         })
    })
 },
 getCartProductList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user: new ObjectId(userId)})
       resolve(cart.products)
    })
 },
 getUserOrders:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        console.log(userId)
        let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: new ObjectId(userId) }).toArray()
        console.log(orders)
        resolve(orders)
    })
 },
 getOrderProducts:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
        let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{_id:new ObjectId(orderId)}
            },{
                $unwind:'$products'
            },{
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
            },{
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'

                }
            },
            {
                $project:{
                    item:1, quantity:1,product:{$arrayElemAt:['$product',0]}
                }
            }
        ]).toArray()
        console.log(orderItems)
       resolve(orderItems)
    })
 },
 generateRazorpay:(orderId,total)=>{
    return new Promise((resolve,reject)=>{
        var instance = new Razorpay({ key_id: 'rzp_test_2vbnJMXJvB8UNJ',
        key_secret:'8B5gt4y15J8ImzZcVCeLuLPl' })
        instance.orders.create({
        amount: total*100,
        currency: "INR",
        receipt:orderId,
        },function(err,order){ console.log("new",order)
        resolve(order)
    })

    })
 },
 verifyPayment:(details)=>{
return new Promise((resolve,reject)=>{
    const crypto=require('crypto')
    let hmac=crypto.createHmac('sha256','8B5gt4y15J8ImzZcVCeLuLPl')
    hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
    hmac=hmac.digest('hex')
    if(hmac==details['payment[razorpay_signature]']){
        resolve()
    }else{
        reject()
    }
})
},
changePaymentStatus:(orderId)=>{
    return new Promise((resolve,reject)=>{
     db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:new ObjectId(orderId)},
    {
        $set:{
            status:'placed'
        }
    }).then(()=>{
        resolve()
    })  
    })
},
productByClick:(prodId)=>{
    return new Promise(async(resolve,reject)=>{
        let product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:new ObjectId(prodId)})
       resolve()
    })
 }

}