var db= require('../config/connection')
var collection= require('../config/collections');
var {ObjectId}=require('mongodb')
const { response } = require('../app')

module.exports={
        usersInfo:()=>{
            return new Promise(async(resolve,reject)=>{
                let user = await db.get().collection(collection.USER_COLLECTION).find().toArray()
                resolve(user)
            })
        }
}