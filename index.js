const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.POST || 5000




app.use(express.json())

app.use(cors())



console.log(process.env.DB_USERNAME)

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSSWORD}@cluster0.zoyeiku.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        const userCollection = client.db('assetManagement').collection('user')


        app.post('/adddAdmin', async(req, res) =>{
            const UserData = req.body
            const result = await userCollection.insertOne(UserData)
            res.send(result)

        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        
    }
}
run().catch(console.dir);





app.get('', (req, res) => {
    res.send('AsestManagement....')
})


app.listen(port, () => {
    console.log(`My server running on port ${port}`)
})