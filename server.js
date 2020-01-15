const express = require('express');
const app = express();

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const baseUrl = 'mongodb://127.0.0.1:27017';

// Database Name
const dbName = 'gares_sncf_db';

// Create a new MongoClient
const client = new MongoClient(baseUrl);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});
// Use connect method to connect to the Server
client.connect(function(err) {
    assert.equal(err, null);
    console.log("Connected correctly to server");
});

// get all department and their number of gares
const getDepartements = function(db, callback) {
  const collection = db.collection("gares");
  return collection.aggregate(
    [
      {
        $group:
        {
          _id: { entry: "$fields.departement"},
          count: { $sum: 1},
        }
      },
      {$sort: { count: 1 }}
    ]).toArray(function(err, data) {
      if (err) {
        assert.equal(err, null);
      }
    	callback(data);
    });
}


const getDepGares = function(db, param, callback) {
  const collection = db.collection("gares");
  return collection.find({"fields.departement": param}).project({fields: 1, geometry: 1})
    .toArray(function(err, data) {
      if (err) {
        assert.equal(err, null);
      }
    	callback(data);
    });

}

const getGaresCoords = function(db, param, callback) {
  const collection = db.collection("gares");

  return collection.find({"fields.departement": param}).project({"fields.libelle": 1, geometry: 1})
    .toArray(function(err, data) {
      if (err) {
        assert.equal(err, null);
      }
    	callback(data);
    });

}

// get all departements with their fields
const allDeps = function(db,param, callback) {
  const collection = db.collection("gares");

  return collection.find({}).limit(param).project({"fields": 1})
    .toArray(function(err, data) {
      if (err) {
        assert.equal(err, null);
      }
    	callback(data);
    });

}

app.get('/departements', function(req, res) {
  const db = client.db(dbName);
  getDepartements(db, function(data) {
    let resp = []
    if (data) {
      resp = data.map(item => {
        return { entry: item._id.entry, count: item.count } ;
      });

      return res.json(resp);
    }else {
      return res.status(400)
    }
  })

});

app.get('/all_deps', function(req, res) {
  const db = client.db(dbName)
  const limit = parseInt(req.query.limit, 10);
  allDeps(db,limit, function(data) {
    let resp = []
    if (data) {
      resp = data.map(item => {
        return item.fields ;
      });

      return res.json(resp);
    }else {
      return res.status(400)
    }
  })

});

app.get('/departementGares', function(req, res) {
  const db = client.db(dbName);
  getDepGares(db,req.query.q, function(data) {
    if (data) {
      return res.json(data);
    }else {
      return res.status(400)
    }
  })

});


const port = 3000;
app.listen(port, () => {
  console.log('app listening on ' + port);
});
