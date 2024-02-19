const express = require('express');
const app = express();

/////database connection///
const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://srivastavasnigdha519:mjQnzizxDENnZQ8G@readone.ewtbxdf.mongodb.net/ReadwiseDB?retryWrites=true&w=majority", {
  useNewUrlParser: true
});

const userSchema = {
  email: String,
  emailId: String,
  password: String
}

const noteSchema = {
  user: String,
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

app.use(express.json());
let userName = "user1";
let foundNote;
let todayQuote;
let list;
let tags;


app.get('/home', async (req, res) => 
{
  try{
      let currentDate = new Date().toJSON().slice(0, 10);
      let passContent;
      let passBook;
      const todayQuote = await Quote.find({user: userName, date: currentDate}); //find the mailID of the user
    //in the event that the daily mail code didn't run
      if (todayQuote.length === 0) {
          console.log("length is 0");
          passContent = "Nothing is as good or bad as it seems - NYU prof. Scott Galloway";
          passBook = "Psychology of Money";

        } else {

    passContent = todayQuote[0].content;
    passBook = todayQuote[0].book;
    //res.json(todayQuote[0]);
        }
        res.json({content: passContent ,book: passBook ,message: userName});
  }
  catch(err){
    console.error('Error fetching note:', err);
    res.status(500).json({ error: 'Failed to retrieve user note' });
  }
});



app.get('/Collection', async (req, res) => {
  try{
    const list = await Note.find({user: userName});
    res.json(list);
    console.log(list);
  }
  catch(err){
    console.error('Error fetching notes:', err);

    res.status(500).json({ error: 'Failed to retrieve notes' });
  }
});


app.post('/deleteData', async(req, res) => {
try{
  const idOfNoteToBeDeleted = req.body;
  const check = await Note.deleteOne({user: userName, _id: idOfNoteToBeDeleted.noteId});
  console.log("Successfully deleted");
  res.status(200).json({message: "deleted successfully"});
}
catch(err){
  console.error('Error fetching notes:', err);
  res.status(500).json({ error: 'Failed to retrieve notes' });
}
});


app.post('/sendComposeData', async(req, res) => {
  const newNote = new Note(
    {
      user: userName,
      book: req.body.title,
      content: req.body.description,
      tag: req.body.tag.toLowerCase()
    } );
    console.log(newNote);
  newNote.save();
res.status(200).json({message: "saved successfully"});
});


app.post('/sendLoginData', async(req, res) => {
try{
userName = req.body.username;
password = req.body.password;

  const foundUser = await User.findOne({email: userName});

    if(foundUser){
      if(foundUser.password === password){
        console.log("PASSWORD MATCHED")
        res.status(200).json({message: "clear"});
      }
      else{
        console.log("INCORRECT PASSWORD");
        alert("Invalid login");
      res.status(400).json({message: "incorrect credentials"});
      }
    }
    else{ //incorrect email
      console.log("INCORRECT EMAIL")
    }
  }

  catch(err){
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Failed to retrieve notes' });
  }

});

app.post('/sendSignUpData', async(req, res) => {
userName = req.body.username;
console.log("reached in sign up post")
const newUser = new User(
  {
    email: req.body.username,
    emailId: req.body.email,
    password: req.body.password
  } );

  console.log(newUser);
newUser.save();

//setting up quotes for the new user

const note1 = new Note({
  user: userName,
  tag: "quote",
  book: "Think Again",
  content: "Freeze and seize"
});

note1.save();

const note2 = new Note({
  user: userName,
  tag: "quote",
  book: "Psychology of Money",
  content: "Nothing is as good or bad as it seems - NYU prof. Scott Galloway"
});

note2.save();

const note3 = new Note({
  user: userName,
  tag: "quote",
  book: "Mindset",
  content: "In one world, effort is a bad thing. It, like failure, means you’re not smart or talented. If you were, you wouldn’t need effort. In the other world, effort is what makes you smart or talented."
});

note3.save();
//check if user with the same username exists
 res.status(200).json({message: "Success"})

});


app.listen(8000, () => {
  console.log(`Server is running on port 8000.`);
});