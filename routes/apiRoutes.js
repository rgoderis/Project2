var db = require("../models");
var petfinder = require("@petfinder/petfinder-js");
var passport = require("../config/passport");

require("dotenv").config();

var client = new petfinder.Client({
  apiKey: process.env.petKey,
  secret: process.env.petSecret
});

var animalsCall = function(type, size, gender) {
  client.animal
    .search({
      type: type,
      location: "Orlando, Fl",
      size: size,
      gender: gender,
      limit: 100
    })
    .then(function(response) {
      for (var i = 0; i < response.data.animals.length; i++) {
        if (response.data.animals[i].photos[0] === undefined) {
          console.log("No Photo");
        } else {
          db.animal
            .create({
              type: response.data.animals[i].type,
              name: response.data.animals[i].name,
              breed: response.data.animals[i].breeds.primary,
              age: response.data.animals[i].age,
              gender: response.data.animals[i].gender,
              size: response.data.animals[i].size,
              specialNeeds: response.data.animals[i].attributes.special_needs,
              children: response.data.animals[i].environment.children,
              dogs: response.data.animals[i].environment.dogs,
              cats: response.data.animals[i].environment.cats,
              photo: response.data.animals[i].photos[0].medium,
              url: response.data.animals[i].url
            })
            .then(function() {
              console.log("Scraping API for new data...");
            });
        }
      }
      console.log("finished");
    })
    .catch(function(error) {
      console.log(error);
    });
};

module.exports = function(app) {
  //   // Get all examples
  //   app.get("/api/examples", function(req, res) {
  //     db.Example.findAll({}).then(function(dbExamples) {
  //       res.json(dbExamples);
  //     });
  //   });

  app.post("/api/login", passport.authenticate("local"), function(req, res) {
    res.json(req.user);
  });
  app.post("/api/signup", function(req, res) {
    db.User.create({
      userName: req.body.userName,
      email: req.body.email,
      password: req.body.password,
      preferredAnimal: req.body.preferredAnimal,
      livingSituation: req.body.livingSituation,
      children: req.body.children,
      otherCats: req.body.otherCats,
      otherDogs: req.body.otherDogs,
      activityLevel: req.body.activityLevel
    })
      .then(function() {
        res.redirect(307, "/api/login");
      })
      .catch(function(err) {
        res.status(401).json(err);
      });
  });
  //   // Create a new example
  //   app.post("/api/examples", function(req, res) {
  //     db.Example.create(req.body).then(function(dbExample) {
  //       res.json(dbExample);
  //     });
  //   });

  //   // Delete an example by id
  //   app.delete("/api/examples/:id", function(req, res) {
  //     db.Example.destroy({ where: { id: req.params.id } }).then(function(dbExample) {
  //       res.json(dbExample);
  //     });
  //   });

  // retrieve information from user
  app.get("/results/:email", function(req, res) {
    db.User.findOne({ where: { email: req.params.email } }).then(function(
      results
    ) {
      let livingArr = results.livingSituation.split(" ");
      if(livingArr.indexOf('Large') !== -1){
        livingArr.push("Extra Large");
      }
      console.log(livingArr);
      const childrenArr = results.children.split("-").map(Number);
      const catsArr = results.otherCats.split("-").map(Number);
      const dogsArr = results.otherDogs.split("-").map(Number);
      const ageArr = results.activityLevel.split(" ");
      
      console.log(childrenArr);
      console.log(catsArr);
      console.log(dogsArr);
      console.log(ageArr);
      db.animal
        .findAll({
          where: {
            type: results.preferredAnimal,
            children: {
              [db.Sequelize.Op.or]: childrenArr
            },
            cats: {
              [db.Sequelize.Op.or]: catsArr
            },
            dogs: {
              [db.Sequelize.Op.or]: dogsArr
            },
            age: {
              [db.Sequelize.Op.or]: ageArr
            },
            size: {
              [db.Sequelize.Op.or]: livingArr
            }
          },
          limit:20
        })
        .then(function(result) {
          console.log(result);
        });
      console.log(results);
      res.render("results");
    });
  });

  // Create Animals DB
  app.post("/api/scraper", function() {
    animalsCall("dog", "small", "male");
    animalsCall("dog", "medium", "male");
    animalsCall("dog", "large", "male");
    animalsCall("dog", "xlarge", "male");
    animalsCall("dog", "small", "female");
    animalsCall("dog", "medium", "female");
    animalsCall("dog", "large", "female");
    animalsCall("dog", "xlarge", "female");
    animalsCall("cat", "small", "male");
    animalsCall("cat", "medium", "male");
    animalsCall("cat", "large", "male");
    animalsCall("cat", "xlarge", "male");
    animalsCall("cat", "small", "female");
    animalsCall("cat", "medium", "female");
    animalsCall("cat", "large", "female");
    animalsCall("cat", "xlarge", "female");
  });
};
