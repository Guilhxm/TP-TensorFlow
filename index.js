const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios')
const handlebars = require('express-handlebars');

var path = require('path');
var ObjectId = require('mongodb').ObjectID;

const app = express();

// On définie handlebars comme moteur de notre app
app.set('view engine', 'handlebars');

// On indique où se situe le répertoire contenant les layouts 
app.engine('handlebars', handlebars({
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts',
}));

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(bodyParser.json())

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Import MongoClient & connexion à la DB
 */
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb+srv://guilhem:guilhem123@cluster0.1ysho.gcp.mongodb.net/tp-tensorflow';
const dbName = 'tp-tensorflow';
let db;

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    // console.log("Connexion au serveur MongoDB réussie");
    db = client.db(dbName);
});

/**
 * API
 */

app.get('/predictions', async(req, res) => {

    try {
        const docs = await db.collection('predictions').find({}).limit(10).toArray();
        res.status(200).json(docs);
    } catch (err) {
        console.log(err);
        throw err;
    }
});

app.post('/create', async(req, res) => {
    try {
        const predictionData = req.body;
        const prediction = await db.collection('predictions').insertOne(predictionData);
        res.status(200).json(prediction);
    } catch (err) {
        console.log(err);
        throw err;
    }
});

app.delete('/delete/:id', async(req, res) => {
    try {
        const id = req.params.id;
        console.log("id : " + id);
        console.log("req param id : " + req.params.id);
        const docs = await db.collection('predictions').deleteOne({ _id: ObjectId(id) });
        res.status(200).json(docs);
    } catch (err) {
        console.log(err);
        throw err;
    }
});

/**
 * FRONTEND
 */

// Affiche tous les entrées prediction
app.get('/', async(req, res) => {

    // Recupération des entrées prediction
    await axios.get('http://localhost:8080/predictions')
        .then(resp => {
            res.render('show-predictions', {
                prediction_entries: resp.data
            });
        })
        .catch(err => {
            console.log(err);
        });
});

// Supprime une entrée
app.get('/delete/:id', async(req, res) => {
    // Recupération d'une entrée
    await axios.delete('http://localhost:8080/delete/' + req.params.id)
        .then(() => {
            res.redirect('back');
        })
        .catch(err => {
            console.log(err);
        });
});

app.listen(8080, () => {
    console.log("Serveur à l'écoute http://localhost:8080");
});