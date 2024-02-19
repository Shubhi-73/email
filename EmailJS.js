
//importing, requiring and setting all hardcoded values
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const nodemailer = require("nodemailer")
const {google} = require("googleapis")
const axios = require('axios');
require('dotenv').config();

//const JSONStream = require('JSONStream');

const CLIENT_ID = process.env.CLIENT_ID;     
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

////////////////////////////////////////////////////////////////


// const oAuth2Client = new google.auth.OAuth2();
// const serviceAccountCredentials = require('./google.json');
// oAuth2Client.setCredentials(serviceAccountCredentials);
// console.log("THis is the service account CREDENTIALS");

// console.log(serviceAccountCredentials.client_email);




// //passing the credentials to the gmail api to fetch the refresh token
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

//establishing a connection to the mongoDB database
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true
  });
  

//defining schemas
const userSchema = {
  email: String,
  emailId: String,
  password: String
}

const noteSchema = {
  user: String,
  index: Number,
  book: String,
  content: String,
  tag: String
};

const dailyQuoteSchema = {
  user: String,
  date: String,
  book: String,
  content: String,
  tag: String
};

const Quote = mongoose.model("Quote", dailyQuoteSchema); //singular version of the collection
const Note = mongoose.model("Note", noteSchema); //singular version of the collection
const User = mongoose.model("User", userSchema); //singular version of the collection

app.use(bodyParser.urlencoded({
  extended: true
}));


async function UsersList(){
    try{
        allUsers = await User.distinct("email") //array of all distict users
        return allUsers;
    }
    catch(err){
        console.log(err);
    }
   
}


async function getUser(userName){
    try{
        const mailId = await User.find({email: userName},{emailId: 1}) //find the mailID of the user
        return mailId[0].emailId;
    }
    catch(err){
        console.log(err);
    }
  
}

       
function saveQuote(foundNote,userName){   
        let currentDate = new Date().toJSON().slice(0, 10); // "2022-06-17"

        //saving today's quote
        const newQuote = new Quote({
            user: foundNote[0].user,
            date: currentDate,
            book: foundNote[0].book,
            content: foundNote[0].content,
            tag: foundNote[0].tag
        });

        newQuote.save();
   }
           
       

async function sendMail(mailId,foundNote)
          {
            try
            {
                const accessToken = await oAuth2Client.getAccessToken();

                // const transport = nodemailer.createTransport(
                //   {
                //       service: 'gmail',
                //       auth:
                //       {
                //           type: 'OAuth2',
                //           user: serviceAccountCredentials.client_email,
                //           serviceClient: serviceAccountCredentials.client_id,
                //           privateKey: serviceAccountCredentials.private_key,
                    
                //       },
                //   });

                const transport = nodemailer.createTransport(
                {
                    service: 'gmail',
                    auth:
                    {
                        type: 'OAuth2',
                        user: 'srivastava.snigdha519@gmail.com',
                        clientId: CLIENT_ID,
                        clientSecret: CLIENT_SECRET,
                        refreshToken: REFRESH_TOKEN,
                        accessToken: accessToken,
                    },
                });

                const mailOptions =
                {
                  from: 'Readwise <srivastava.snigdha519@gmail.com>',
                  to: mailId,
                  subject: 'Quote of the day!',
                  text: 'Hello from the other side',
                  html: '<div style="background-color: #95D1CC;text-align: center;padding: 1em; border-radius: 25% 10%; font: Roboto;">'+'<h2>'+foundNote[0].book+'</h2><h3 style="font-style: italic;">'+foundNote[0].content+'</h3></div>'
                }

                const result = await transport.sendMail(mailOptions);
                console.log("reached till send mail");
                return result;
            } catch (error)
            {
              console.log(error);
              return error;
            }
          } //sendMail()
          
          app.get('/run', async (req, res) => {
            try {
                //getting list of users
                const userList = await UsersList();
                console.log(userList);
        
                //iterating through each user 
                for (let i = 0; i < userList.length; i++) {
        
                    let userName = userList[i];
                    console.log("userName" + userName);
                    let userEmail = await getUser(userName);
                    console.log("USEREMIALLLLL")
                    console.log(userEmail)


                    //finding one random document
                    let foundNote = await Note.aggregate([{ $match: { user: userName } }, { $sample: { size: 1 } }]);
                    console.log("NOTE FOUND")
                    console.log(foundNote[0].book);
                    var EmailJSbook = foundNote[0].book;
                    var EmailJScontent = foundNote[0].content;
        
                    //saving today's quote in a new collection for home to render
                    saveQuote(foundNote, userName);
        
                    //send mail to that user
                    var data = {
                        service_id: 'service_u3rmrwe',
                        template_id: 'template_vpsvuti',
                        user_id: 'pEezx_ogYFas2eCoe',
                        template_params: {
                            to_name: userName,
                            book_title: EmailJSbook,
                            note: EmailJScontent,
                            to_email: userEmail,
                        }
                    };
        
                    const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', data, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log("THIS IS THE RESPONSE")
                    console.log(response);
                }
                // You can send a success response back to the client
                res.send('Your mail is sent!');
            } catch (error) {
                console.error(error);
                res.status(500).send('An error occurred while processing your request.');
      
                  
                // } catch (error) {
                //     // Handle error if request fails
                
                //     res.status(400).json({ error: 'Oops... Something went wrong.' });
                // }
          
          
                        // sendMail(userEmail,foundNote) //returns a promise
                        // .then((result) => console.log('Email sent...', result)) //consuming function
                        // .catch((error) => console.log(error.message));
                      
                 
          
                    
                    }     
                  
                 
          });
   
app.listen(4000, () => {
  console.log(`Server is running on port 4000.`);
});