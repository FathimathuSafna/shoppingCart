var db= require('../config/connection')
var collection= require('../config/collections')
const bcrypt=require('bcrypt')
var {ObjectId}=require('mongodb')
const { response } = require('../app')
const collections = require('../config/collections')


module.exports={
    adminSignup: (adminData) => {
        return new Promise(async (resolve, reject)=>{ 
            console.log(adminData)
                adminData.password = await bcrypt.hash(adminData.password,10)
                adminData.confirmPassword = await bcrypt.hash(adminData.confirmPassword,10)
                db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminData)
                    .then((data)=>{
                        resolve({
                            name: adminData.name,
                            email: adminData.email,
                            password: adminData.password,
                            confirmPassword:adminData.confirmPassword,
                            insertedId: data.insertedId,
                            status: 'active'
                        })
                        console.log('adminData:', adminData);
                    })
                    .catch((err) => {
                        console.log(err);
                    })
           
        })
    },
    adminLogin:(adminData)=>{
        return new Promise (async(resolve,reject)=>{
            let response={}
            console.log(adminData)
            let admin= await db.get().collection(collection.ADMIN_COLLECTION).findOne({email:adminData.email})
            console.log(admin)
       if(admin){
        bcrypt.compare(adminData.password,admin.password).then((status)=>{
            console.log(status)
            if (status){
                if(status === true){
                console.log("Login success")
                response.admin=admin
                response.status=true
                resolve(response)
            }else{
            console.log("Login failed")
            resolve({status:false})
        }
    }
    else{
        console.log("Invalid password")
        resolve({status:false})
    }
        })
       } else{
        console.log("Admin not found")
        resolve({status:false})
       }
        })
    },
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