var db= require('../config/connection')
var collection=require('../config/connection')
var {ObjectId}=require('mongodb')
const { response } = require('../app')

module.exports={
        usersInfo:(userId)=>{
            let userData=db.get().collection
        }
}