const mongoClient=require('mongodb').MongoClient


let db = null

module.exports.connect=function(){
    const url='mongodb://localhost:27017'
    const dbname='shopping'

    mongoClient.connect(url)
  .then((data) => {
    console.log('successfully connected to database...') 
    db=data.db(dbname)
  })
  .catch((err) => {
    console.log('error occured'+err)
  })

}
module.exports.get=function(){
    return db
}