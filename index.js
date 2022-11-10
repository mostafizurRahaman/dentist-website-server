const express = require('express'); 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors'); 
const jwt = require('jsonwebtoken'); 
require('dotenv').config(); 
const app = express();
const port = process.env.PORT || 5000; 


// custom middleware for jwt : 
function verifyJWT(req, res, next){
   const headerInfo = req.headers.authorization; 
   if(!headerInfo){
      return res.status(401).send({errorMessage: 'Unauthorized Access'}); 
   }
   const token = headerInfo.split(" ")[1]; 
   jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , function(error, decoded){
      if(error){
         return res.status(403).send({errorMessage: "Forbidden Access"}); 
      }
       req.decoded = decoded; 
       next()   
   })
}
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
      const ContactCollection = client.db('mr-dentist').collection('contacts'); 
      
      app.post('/jwt', async(req, res)=>{
            const user = req.body ; 
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'}); 
            console.log(token); 
            res.send({token}); 
            
      })
      //post services on database : 
      app.post('/services',verifyJWT, async(req, res)=>{
         const {service,price, image, ratings, description } = req.body; 
         const result = await ServiceCollections.insertOne({service, price, image, ratings, description }); 
         res.send(result); 
      })

      //create a get api  for services : 
      app.get('/services', async(req, res)=>{
         const size =parseInt(req.query.size); 
         let services; 
         if(size){
             services = await ServiceCollections.find({}).limit(size).sort({_id: -1}).toArray(); 
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
      app.post('/reviews',verifyJWT,  async(req, res)=>{
          const {email , reviewer, profile, ratings, message, service_name, service_id} = req.body; 
          if(req.decoded.email !== email){
            return res.status(403).send({errorMessage:"Forbidden Access"});
          }
          const dateField = new Date(); 
          const result = await ReviewCollection.insertOne({message, email, reviewer, service_id, service_name, profile, ratings, dateField}); 
          res.send(result); 
         
      })

      // review get api filter with service id: 
      app.get('/reviews/:id', async(req, res)=>{ 
         const id = req.params.id; 
         const query = {service_id: id}; 
         const cursor = ReviewCollection.find(query); 
         const reviews  = await cursor.sort({dateField: -1}).toArray();
         res.send(reviews); 
      })

     
      //reviews get api with email address: 
      app.get('/reviews',verifyJWT, async(req, res)=>{
         
         const email = req.query.email;  
         if(req.decoded.email !== email){
            return res.status(401).send({errorMessage: 'Forbidden Access'});
         }       
         
         if(email){
            const query = {email : email}; 
            const cursor = ReviewCollection.find(query); 
            const reviews = await cursor.sort({dateField: -1}).toArray(); 
            res.send(reviews); 
         }

         // const id = req.query.id; 
         // if(id){
         //    const query = {_id: ObjectId(id)}; 
         //    const review =await ReviewCollection.findOne(query); 
         //    res.send(review); 
         // }
         
      })


      app.get("/review/:id",verifyJWT,  async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)}; 
            const result = await ReviewCollection.findOne(query); 
            res.send(result);
         
      })
      // review api for update data of a review : 
      app.put('/reviews/:id',verifyJWT,  async(req, res)=>{
         const id = req.params.id; 
         const {messageOne, ratingsNew} = req.body; 
         const query = {_id: ObjectId(id)}; 
         const  options = {upsert: true}; 
         const dateField = new Date(); 
         const updatedReview = {
             $set: {
               message: messageOne, 
               ratings: ratingsNew, 
               dateField,
             }
         }
         const result = await ReviewCollection.updateOne(query, updatedReview, options); 
         res.send(result); 
      })
         
      

      

      //review delete api : 
      app.delete('/reviews/:id',verifyJWT, async(req, res)=>{
         const id = req.params.id; 
         const query = {_id: ObjectId(id)}; 
         const result = await ReviewCollection.deleteOne(query); 
         res.send(result) ;
      })


      // contact information : 
      app.post("/contacts",verifyJWT, async(req, res)=>{
         const {firstName, lastName, email, phone, message} = req.body; 
         const result = await ContactCollection.insertOne({firstName, lastName, email, phone, message}); 
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