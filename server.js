const https = require('https');
const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.send('ohai there');
});

app.get('/thing', (req, res) => {
   res.send('this is thing');
});

app.get('/us/:server/:characterName', (req, res) => {
      getCharacterInfo(req, res, displayParsedData);
});

app.use(function(req, res, next) {
  res.status(404).send('Sorry cant find that!');
});

function getCharacterInfo(characterReq, characterRes, callback) {
    https.get('https://us.api.battle.net/wow/character/' + characterReq.params.server +  '/' + characterReq.params.characterName + '?fields=progression,items&locale=en_US&apikey=APIKEY', (res) => {

        res.setEncoding('utf8');

        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);
        console.log('Request made for ' + characterReq.params.characterName + ' on the server ' + characterReq.params.server);

        // variable for incoming data
        var body = '';

        // parses through data as it's recieved. buffer or not.
        res.on('data', (d) => {
            //process.stdout.write(d);
            body += d;
        });

        // parses the recieved data and sends it to the callback function. also catches any errors.
        res.on('end', () => {
           try {
               var parsed = JSON.parse(body);
           } catch (err) {
               console.error('Unable to parse: ', err);
               return callback(err);
           }
           console.log("statusCodev2: " + res.statusCode);
           callback(null, parsed, characterReq, characterRes, res.statusCode);
        });

    }).on('error', (e) => {
        callback(e);
    });
}

// determining character's class based on class id sent from the API
function classIdentity(classId) {
  switch (classId) {
    case 1:
      return "warrior"
    case 2:
      return "paladin"
    case 3:
      return "hunter"
    case 4:
      return "rogue"
    case 5:
      return "priest"
    case 6:
      return "death-knight"
    case 7:
      return "shaman"
    case 8:
      return "mage"
    case 9:
      return "warlock"
    case 10:
      return "monk"
    case 11:
      return "druid"
    case 12:
      return "demon-hunter"
    default:
      return null
  }
}

// overall sorting and filtering of data
function sortParsedData(err, data) {
    if (err) {
      return err;
    } else {
      
      // sorting out character info and progress info
      var sortData = {
        "name": data.name,
        "class": classIdentity(data.class),
        "realm": data.realm,
        "itemLevel": data.items.averageItemLevel,
        "progress": data.progression.raids.filter((item, index) => {
          if(item.name == "The Emerals Nightmare" || item.name == "The Nighthold" || item.name == "Hellfire Citadel") {
            return item;
          }
        })
      }

      return sortData;
    }
}

function displayParsedData(err, data, originReq, originRes, statusCode) {
    if (err) throw err;
    if (statusCode !== 404){
      var sortedData = sortParsedData(err, data);
      originRes.send(sortedData);
    } else {
      originRes.send("The character " + originReq.params.characterName + " does not exist on " + originReq.params.server);
    }
}

app.listen(8080, () => {
    console.log('app is listening to port 8080');
});