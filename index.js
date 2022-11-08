const express = require('express'); 
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors'); 
const jwt = require('jsonwebtoken'); 
require('dotenv').config(); 
const app = express();
const port = process.env.PORT || 5000; 

// middle wares: 
app.use(cors()); 
app.use(express.json()); 

console.log(process.env.DB_USER); 
console.log(process.env.DB_PASS); 
console.log(process.env.ACCESS_TOKEN_SECRET); 

// mongo db  code is here: 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4nkvsmn.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
   try{
      const ServiceCollections = client.db('mr-dentist').collection('services'); 

      //post services on database : 
      app.post('/services', async(req, res)=>{
         const {service,price, image, ratings, description } = req.body; 
         const result = await ServiceCollections.insertOne({service, price, image, ratings, description }); 
         res.send(result); 
      })
   }finally{

   }
}


run().catch(err => console.log(err)); 


app.get('/', (req,res)=> {
   res.send("Mr dentist server is running now......")
})


app.listen(port , ()=> {
   console.log(`server is running on port ${port}`); 
})