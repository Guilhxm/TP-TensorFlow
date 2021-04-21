const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios')
var path = require('path');
const handlebars = require('express-handlebars');

const app = express();


// app.get('/', function(req, res) {
//     res.sendFile(path.join(__dirname + '/index.html'));
// });


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

/**
 * Import MongoClient & connexion à la DB
 */
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb+srv://guilhem:guilhem123@cluster0.1ysho.gcp.mongodb.net/tp-tensorflow';
const dbName = 'tp-tensorflow';
let db;

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    console.log("Connexion au serveur MongoDB réussie");
    db = client.db(dbName);
});

/**
 * API
 */

app.get('/airbnbs', async(req, res) => {
    let nbSkipEntries = 0;

    if (req.query.skip && parseInt(req.query.skip)) {
        nbSkipEntries = parseInt(req.query.skip);
    }

    try {
        const docs = await db.collection('predictions').find({}).skip(nbSkipEntries).limit(10).toArray();
        res.status(200).json(docs);
    } catch (err) {
        console.log(err);
        throw err;
    }
});

app.get('/airbnbs/:_id', async(req, res) => {
    const _id = req.params._id;
    try {
        const docs = await db.collection('predictions').findOne({ _id });
        res.status(200).json(docs);
    } catch (err) {
        console.log(err);
        throw err;
    }
});

app.post('/airbnbs', async(req, res) => {
    try {
        const airbnbData = req.body;
        const airbnb = await db.collection('predictions').insertOne(airbnbData);
        res.status(200).json(airbnb);
    } catch (err) {
        console.log(err);
        throw err;
    }
});

app.put('/airbnbs/:_id', async(req, res) => {
    try {
        const _id = req.params._id;
        const replacementAirbnb = req.body;
        const airbnb = await db.collection('predictions').findOneAndUpdate({ _id }, { $set: replacementAirbnb });
        res.status(200).json(airbnb);
    } catch (err) {
        console.log(err);
        throw err;
    }
});

app.delete('/airbnbs/:_id', async(req, res) => {
    try {
        const _id = req.params._id;
        const airbnb = await db.collection('predictions').deleteOne({ _id });
        res.status(200).json(airbnb);
    } catch (err) {
        console.log(err);
        throw err;
    }
});

/**
 * FRONTEND
 */

// Affiche tous les entrées airbnb
app.get('/', async(req, res) => {
    let nbSkipEntries = 0;

    if (req.query.skip && parseInt(req.query.skip)) {
        nbSkipEntries = parseInt(req.query.skip);
    }

    // Variables utiles pour la pagination
    let nbSkipNext = nbSkipEntries + 10;
    let nbSkipPrevious = (nbSkipEntries <= 10) ? 0 : nbSkipEntries - 10;

    // Recupération des entrées airbnb
    await axios.get('http://localhost:8080/airbnbs?skip=' + nbSkipEntries)
        .then(resp => {
            res.render('show-airbnbs', {
                skip_next: nbSkipNext,
                skip_previous: nbSkipPrevious,
                airbnb_entries: resp.data
            });
        })
        .catch(err => {
            console.log(err);
        });
});

// Supprime une entrée
app.get('/delete/:_id', async(req, res) => {
    // Recupération d'une entrée
    await axios.delete('http://localhost:8080/airbnbs/' + req.params._id)
        .then(() => {
            console.log('deleted');
            res.redirect('back');
        })
        .catch(err => {
            console.log(err);
        });
});

// Modifie une entrée
app.get('/edit/:_id', async(req, res) => {
    // Recupération d'une entrée
    await axios.get('http://localhost:8080/airbnbs/' + req.params._id)
        .then(resp => {
            res.render('edit-airbnb', {
                name: resp.data.name,
            });
        })
        .catch(err => {
            console.log(err);
        });
});

app.listen(8080, () => {
    console.log("Serveur à l'écoute http://localhost:8080");
});