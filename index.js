const express = require('express'); 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors'); 
const jwt = require('jsonwebtoken'); 
require('dotenv').config(); 
const app = express();
const port = process.env.PORT || 5000; 

// middle wares: 
app.use(cors()); 
app.use(express.json()); 


// mongo db  code is here: 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4nkvsmn.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
   try{
      const ServiceCollections = client.db('mr-dentist').collection('services'); 
      const ReviewCollection = client.db('mr-dentist').collection('reviews'); 
      //post services on database : 
      app.post('/services', async(req, res)=>{
         const {service,price, image, ratings, description } = req.body; 
         const result = await ServiceCollections.insertOne({service, price, image, ratings, description }); 
         res.send(result); 
      })

      //create a get api  for services : 
      app.get('/services', async(req, res)=>{
         const size =parseInt(req.query.size); 
         let services; 
         if(size){
             services = await (await ServiceCollections.find({}).limit(size).sort({_id: -1}).toArray()); 
         }else{
            services = await ServiceCollections.find({}).toArray(); 
         }
         res.send(services); 
      })

      // single service get api : 
      app.get('/services/:id', async(req, res)=>{
         const id =req.params.id; 
         const query = {_id: ObjectId(id)}; 
         const service = await ServiceCollections.findOne(query); 
         res.send(service) ; 
      })


      // review post api :
      app.post('/reviews', async(req, res)=>{
          const {email , reviewer, profile, ratings, message, service_name, service_id} = req.body; 
          const dateField = new Date(); 
          const result = await ReviewCollection.insertOne({message, email, reviewer, service_id, service_name, profile, ratings, dateField}); 
          res.send(result); 
         
      })

      // review get api filter with post: 
      app.get('/reviews/:id', async(req, res)=>{ 
         const id = req.params.id; 
         const query = {service_id: id}; 
         const cursor = ReviewCollection.find(query); 
         const reviews  = await cursor.sort({dateField: -1}).toArray();
         res.send(reviews); 
      })

      //reviews get api with email address: 
      app.get('/reviews', async(req, res)=>{
         const email = req.query.email; 
         const query = {email : email}; 
         const cursor = ReviewCollection.find(query); 
         const reviews = await cursor.sort({dateField: -1}).toArray(); 
         res.send(reviews); 
         
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