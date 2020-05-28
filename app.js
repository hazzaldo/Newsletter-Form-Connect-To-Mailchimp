require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const https = require('https');

const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  const filename = __dirname + '/signup.html';
  res.sendFile(filename, err => {
    if (err) {
      res.send('There was an error: ', err);
    } else {
      console.log('Webpage sent successfully: ', filename);
    }
  });
});

app.post('/', (req, res) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;

  //package post data (from form) into JSON
  const data = {
    members: [
      {
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName
        }
      }
    ]
  };

  const jsonData = JSON.stringify(data);

  // make POST request to mailchimp server
  const url = 'https://us19.api.mailchimp.com/3.0/lists/d4cf385c42';
  const options = {
    method: 'POST',
    auth: process.env.MAILCHIMP_AUTH
  };

  const request = https.request(url, options, response => {
    response.on('data', data => {
      const parsedResObj = JSON.parse(data);

      if (response.statusCode < 200 || response.statusCode > 299) {
        const failureHTMLFile = __dirname + '/failure.html';
        res.sendFile(failureHTMLFile, err => {
          if (err) {
            next(err); // Pass errors to express
          } else {
            console.log(`File sent: ${failureHTMLFile}`);
          }
        });
      } else if (parsedResObj.error_count !== 0) {
        res.write(`<h1 style="text-align:center;">Uh Oh!</h1>`);
        res.write(`<p>Error: ${parsedResObj.errors[0].error}</p>`);
        res.write(`<a href="/">Back to subscription form page</a>`);
        res.send();
      } else if (response.statusCode >= 200 || response.statusCode <= 299) {
        const successHTMLFile = __dirname + '/success.html';
        res.sendFile(successHTMLFile, err => {
          if (err) {
            next(err);
          } else {
            console.log(`File sent: ${successHTMLFile}`);
          }
        });
      } else {
        const failureHTMLFile = __dirname + '/failure.html';
        res.sendFile(failureHTMLFile, err => {
          if (err) {
            next(err); // Pass errors to express
          } else {
            console.log(`File sent: ${failureHTMLFile}`);
          }
        });
      }

      console.log('Returned JSON: ', parsedResObj);
    });
  });

  request.write(jsonData);
  request.end();
});

app.post('/failure', (req, res) => res.redirect('/'));

// process.env.PORT - allow Heroku host server to pick its preferred port dynamically.
// process.env.PORT is defined by Heroku and not recognised by your localhost (i.e. your local machine) as a port.
// By having `|| 3000` we're allowing for our app to be able to run on either Heroku or a local machine, in case we need to run it on a local machine
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, () =>
  console.log('Server started, listening on port: ', port)
);