const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.POST || 5000




app.use(express.json())

app.use(cors())



console.log(process.env.DB_USERNAME)

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const AssetCollection = client.db('assetManagement').collection('asssets')
        const TeamtCollection = client.db('assetManagement').collection('Teams')


        app.post('/adddAdmin', async (req, res) => {
            const UserData = req.body
            const result = await userCollection.insertOne(UserData)
            res.send(result)

        })

        app.get('/asset-list/:email', async (req, res) => {
            const email = req.params.email
            const queryValue = req.query

            const querys = { email: email }
            if (queryValue.search) {
                const combinedFilter = {
                    $and: [
                        { email: email },
                        // {assetType: queryValue.type},
                        { assetName: { $regex: queryValue.search, $options: 'i' } }
                    ]
                };
                const result = await AssetCollection.find(combinedFilter).toArray()
                res.send(result)
            } else if (queryValue.type) {
                const combinedFilter = {
                    $and: [
                        { email: email },
                        // {assetType: queryValue.type},
                        { assetType: queryValue.type }
                    ]
                };
                const result = await AssetCollection.find(combinedFilter).toArray()
                res.send(result)
            } else if (queryValue.type && queryValue.search) {
                const combinedFilter = {
                    $and: [
                        { email: email },
                        { assetName: { $regex: queryValue.search, $options: 'i' } },
                        { assetType: queryValue.type }
                    ]
                };
                const result = await AssetCollection.find(combinedFilter).toArray()
                res.send(result)
            }

            else {

                const result = await AssetCollection.find(querys).toArray()
                res.send(result)
            }
        })

        app.get('/emplyees', async (req, res) => {
            const combinedFilter = {
                $and: [
                    { isAdmin: false },
                    // {assetType: queryValue.type},
                    { inTeam: false }
                ]
            };

            const result = await userCollection.find(combinedFilter).toArray()
            res.send(result)

        })

        app.get('/team-employee/:email', async(req, res) =>{
            const adminEmail = req.params.email
            const filter = {adminEmail: adminEmail}
            const result = await TeamtCollection.find(filter).toArray()
            res.send(result)
        })

        app.delete('/remove-emplyees/:id', async (req, res) =>{
            const Id = req.params.id
            const EmId = req.query.employeId

            const filter = {_id: new ObjectId(EmId)}

            const UpdateEmployee = {
                $set: {
                    inTeam: false
                }
            }

            const updateEmployee = await userCollection.updateOne(filter, UpdateEmployee)
    
            const query = {_id: new ObjectId(Id)}
            
            const result = await TeamtCollection.deleteOne(query)
            res.send({result, updateEmployee})
        })

        app.post('/add-employee', async(req, res) =>{
            const TeamData = req.body
            const EmployeeId =TeamData.employee._id
            const filter = {_id: new ObjectId(EmployeeId)}

            const UpdateEmployee = {
                $set: {
                    inTeam: true
                }
            }

            const updateEmployee = await userCollection.updateOne(filter, UpdateEmployee)

            const result = await TeamtCollection.insertOne(TeamData)
            res.send({result, updateEmployee})
        })

        

        app.post('/add-asset', async (req, res) => {
            const AssetData = req.body
            const result = await AssetCollection.insertOne(AssetData)
            res.send(result)
        })




        // Employee Section


        app.get(`/my-team/:email`, async(req, res) =>{
            const email = req.params.email
            const query = {'employee.email': email}
            const result = await TeamtCollection.findOne(query)
            res.json(result)
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