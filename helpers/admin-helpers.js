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
        },
        blockUser: (userId) => {
            return new Promise(async (resolve, reject) => {
                try {
                    await db.get().collection(collection.USER_COLLECTION).updateOne(
                        { _id: new ObjectId(userId) },
                        { $set: { status: 'blocked' } } // Update the status to 'blocked'
                    ).then((response)=>{
                        resolve( {blockUser :true})
                    })
                    
                } catch (err) {
                    reject(err)
                }
            })
        },
        unBlockUser: (userId) => {
            return new Promise(async (resolve, reject) => {
                try {
                    await db.get().collection(collection.USER_COLLECTION).updateOne(
                        { _id: new ObjectId(userId) },
                        { $set: { status: 'active' } } // Update the status to 'active'
                    ).then((response)=>{
                        resolve( {unBlockUser :true})
                    })
                    
                } catch (err) {
                    reject(err)
                }
            })
        }
}