const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken')
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
        const RequestCollection = client.db('assetManagement').collection('requests')
        const CustomRequestCollection = client.db('assetManagement').collection('Customrequests')


        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: "Forbidden Access" })
            }
            const token = req.headers.authorization.split(' ')[1]
            if (!token) {
                return res.status(401).send({ message: "Forbidden Access" })
            }
            jwt.verify(token, process.env.SecretKey, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: "Forbidden Access" })
                }
                req.decoded = decoded
                next()
            })
        }

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email }
            const user = await userCollection.findOne(query)
            const isAdmin = user?.role === 'admin'
            if (!isAdmin) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            next()
        }


        // jwt releted API
        app.post('/jwt', (req, res) => {
            const user = req.body
            console.log('Hello Bangladesh')
            const token = jwt.sign(user, process.env.SecretKey, { expiresIn: '1h' })
            res.send({ token })
        })



        app.get('/user/admin/:email', async (req, res) => {
            const email = req.params.email
            console.log(email)
            const query = { email: email }
            const result = await userCollection.findOne(query)
            // if (email !== req.decoded.email) {
            //     return res.status(403).send({ message: 'Unauthorize Access' })
            // }
            // const query = { email: email }
            // const user = await userCollection.findOne(query)
            // console.log(user)
            // let admin = false
            // if (user) {
            //     admin = user?.isAdmin === true
            // }
            const isAdmin = result.isAdmin
            res.send(isAdmin)
        })



        app.post('/adddAdmin', async (req, res) => {
            const UserData = req.body
            const result = await userCollection.insertOne(UserData)
            res.send(result)

        })

        app.get('/asset-list/:email', async (req, res) => {
            const email = req.params.email
            const queryValue = req.query
            console.log(queryValue)

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

        app.delete('/delete-asset/:id', async (req, res) => {
            const Id = req.params.id
            const query = { _id: new ObjectId(Id) }
            const result = await AssetCollection.deleteOne(query)
            res.send(result)
        })

        app.get('/asset/:id', async (req, res) => {
            const Id = req.params.id
            const query = { _id: new ObjectId(Id) }
            const result = await AssetCollection.findOne(query)
            res.send(result)
        })

        app.get('/all-asset', async (req, res) => {
            const queryValue = req.query

            if (queryValue.search) {
                const query = {
                    assetName: { $regex: queryValue.search, $options: 'i' }
                }
                const result = await AssetCollection.find(query).toArray()
                res.send(result)
            }
            else if (queryValue.type === 'availableStock') {
                const query = { assetQuantity: { $gt: 0 } };
                const result = await AssetCollection.find(query).toArray()
                res.send(result)
            }


            else if (queryValue.type) {
                const query = { assetType: queryValue.type }

                const result = await AssetCollection.find(query).toArray()
                res.send(result)
            }


            else if (queryValue.type && queryValue.type) {
                const combinedFilter = {
                    $and: [
                        { assetName: { $regex: queryValue.search, $options: 'i' } },
                        { assetType: queryValue.type }
                    ]
                };
                const result = await AssetCollection.find(combinedFilter).toArray()
                res.send(result)
            }


            else {
                const result = await AssetCollection.find().toArray()
                res.send(result)
            }
        })

        app.post('/send-request', async (req, res) => {
            const requestData = req.body
            const assetId = requestData.singleAsset._id
            const filter = { _id: new ObjectId(assetId) }
            const UpdateAsset = {
                $inc: {
                    assetQuantity: -1
                }
            }
            const updateAssets = await AssetCollection.updateOne(filter, UpdateAsset)
            const result = await RequestCollection.insertOne(requestData)
            res.send({ result, updateAssets })
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

        app.get('/team-employee/:email', async (req, res) => {
            const adminEmail = req.params.email
            const filter = { adminEmail: adminEmail }
            const result = await TeamtCollection.find(filter).toArray()
            res.send(result)
        })

        app.delete('/remove-emplyees/:id', async (req, res) => {
            const Id = req.params.id
            const EmId = req.query.employeId

            const filter = { _id: new ObjectId(EmId) }

            const UpdateEmployee = {
                $set: {
                    inTeam: false
                }
            }

            const updateEmployee = await userCollection.updateOne(filter, UpdateEmployee)

            const query = { _id: new ObjectId(Id) }

            const result = await TeamtCollection.deleteOne(query)
            res.send({ result, updateEmployee })
        })

        app.post('/add-employee', async (req, res) => {
            const TeamData = req.body
            const EmployeeId = TeamData.employee._id
            const filter = { _id: new ObjectId(EmployeeId) }

            const UpdateEmployee = {
                $set: {
                    inTeam: true
                }
            }

            const updateEmployee = await userCollection.updateOne(filter, UpdateEmployee)

            const result = await TeamtCollection.insertOne(TeamData)
            res.send({ result, updateEmployee })
        })



        app.post('/add-asset', async (req, res) => {
            const AssetData = req.body
            const result = await AssetCollection.insertOne(AssetData)
            res.send(result)
        })

        app.get('/admin-request/:email', async (req, res) => {
            const Email = req.params.email
            const filter = { 'singleAsset.email': Email }
            const result = await RequestCollection.find(filter).toArray()
            res.json(result)
        })

        app.put('/aprove-request/:id', async (req, res) => {
            const Id = req.params.id
            const query = { _id: new ObjectId(Id) }
            const updateRequest = {
                $set: {
                    isAprove: true
                }
            }
            const result = await RequestCollection.updateOne(query, updateRequest)
            res.send(result)
        })


        app.get('/all-custom-request', async (req, res) => {
            console.log('Hello')
            const ressult = await CustomRequestCollection.find().toArray()
            res.send(ressult)
        })

        app.put('/update-custom-request/:id', async (req, res) => {
            const Id = req.params.id
            const query = { _id: new ObjectId(Id) }
            const options = { upsert: true };
            const updateRequest = {
                $set: {
                    isAprove: true
                }
            }
            const result = await CustomRequestCollection.updateOne(query, updateRequest, options)
            res.send(result)

        })
        app.delete('/cansel-custom-requst/:id', async (req, res) => {
            const Id = req.params.id
            const query = { _id: new ObjectId(Id) }
            const result = await CustomRequestCollection.deleteOne(query)
            res.send(result)
        })






        // Employee Section


        app.get(`/my-team/:email`, async (req, res) => {
            const email = req.params.email
            const query = { 'employee.email': email }
            const result = await TeamtCollection.findOne(query)
            res.json(result)
        })

        app.get('/my-asset/:email', async (req, res) => {
            const Email = req.params.email
            const queryValue = req.query

            if (queryValue.fiter == 'pending') {
                const combinedFilter = {
                    $and: [
                        { userEmail: Email },
                        // {assetType: queryValue.type},
                        { isAprove: false }
                    ]
                };
                const result = await RequestCollection.find(combinedFilter).toArray()
                res.send(result)
            }
            else if (queryValue.fiter == 'aprove') {
                const combinedFilter = {
                    $and: [
                        { userEmail: Email },
                        // {assetType: queryValue.type},
                        { isAprove: true }
                    ]
                };
                const result = await RequestCollection.find(combinedFilter).toArray()
                res.send(result)
            }

            else if (queryValue.fiter == 'returnable') {
                const combinedFilter = {
                    $and: [
                        { userEmail: Email },
                        // {assetType: queryValue.type},
                        { 'singleAsset.assetType': 'returnable' }
                    ]
                };
                const result = await RequestCollection.find(combinedFilter).toArray()
                res.json(result)
            }
            else if (queryValue.fiter == 'nonreturnable') {
                const combinedFilter = {
                    $and: [
                        { userEmail: Email },
                        // {assetType: queryValue.type},
                        { 'singleAsset.assetType': 'nonreturnable' }
                    ]
                };
                const result = await RequestCollection.find(combinedFilter).toArray()
                res.json(result)
            }
            else if (queryValue.search) {
                const combinedFilter = {
                    $and: [
                        { userEmail: Email },
                        // {assetType: queryValue.type},
                        { 'singleAsset.assetName': { $regex: queryValue.search, $options: 'i' } }
                    ]
                };
                const result = await RequestCollection.find(combinedFilter).toArray()
                res.json(result)
            }
            else {
                const query = { userEmail: Email }
                const result = await RequestCollection.find(query).toArray()
                res.send(result)
            }

        })

        app.delete('/cansel-requst/:id', async (req, res) => {
            const Id = req.params.id
            const query = { _id: new ObjectId(Id) }
            const result = await RequestCollection.deleteOne(query)
            res.send(result)
        })

        app.put('/update-request/:id', async (req, res) => {
            const Id = req.params.id
            const AssetId = req.query
            const assetId = AssetId.assetId
            const filter = { _id: new ObjectId(assetId) }
            const UpdateAsset = {
                $inc: {
                    assetQuantity: +1
                }
            }
            const query = { _id: new ObjectId(Id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    retured: true
                },
            };
            const updateAssets = await AssetCollection.updateOne(filter, UpdateAsset)
            const result = await RequestCollection.updateOne(query, updateDoc, options)

            res.send({ result, updateAssets })

        })

        app.post('/custom-Request', async (req, res) => {
            const requestData = req.body
            const result = await CustomRequestCollection.insertOne(requestData)
            res.send(result)
        })

        app.get('/custom-request/:email', async (req, res) => {
            const email = req.params.email
            const query = { userEmail: email }
            const result = await CustomRequestCollection.find(query)
            res.send(result)

        })


        // -------------------------- Admin Dashbord -----------------------

        app.get('/pending-request', async (req, res) => {
            const query = { isAprove: false }
            const result = await RequestCollection.find(query).limit(5).toArray()
            res.send(result)
        })

        app.get('/top-requests', async (req, res) => {
            const pipeline = [
                {
                    $group: {
                        _id: '$singleAsset',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 4 // Adjust the limit based on how many top items you want to retrieve
                }
            ];

            const topRequests = await RequestCollection.aggregate(pipeline).toArray();
            res.send(topRequests);

        });

        app.get('/limit-stock', async(req, res) =>{
            
        })


        // --------------------------Employe Dashbord ----------------------





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