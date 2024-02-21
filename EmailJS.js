
//importing, requiring and setting all hardcoded values
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const nodemailer = require("nodemailer");
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

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
           
          
            const task = async() => {
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
                 
                }
            
            } catch (error) {
                console.error(error);  
                 }     
             
                 
          };

          // Schedule the task to run at 7 am every day
    cron.schedule('15 22 * * *', async () => 
    {
        try {
            await task();
        } catch (error) {
            console.error('Error occurred:', error);
        }
    },
    {
        scheduled: true,
        timezone: "Asia/Kolkata"
    }

);
   
app.listen(4000, () => {
  console.log(`Server is running on port 4000.`);
});