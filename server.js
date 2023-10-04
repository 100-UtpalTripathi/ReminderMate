require('dotenv').config();
const express = require('express');
const app = express();
const { connectMongoose, User, Reminder } = require("./database.js");
const ejs = require('ejs');
const { initializingPassport, isAuthenticated } = require('./passportConfig.js');
const passport = require('passport');
const expressSession = require('express-session');
const cors = require('cors');

connectMongoose();
initializingPassport(passport);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressSession({ secret: "secret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());
app.set('view engine', "ejs");


app.get("/", (req, res) => {
  res.render("index");
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/login", (req, res) => {
  res.render("login");
});


app.post("/register", async (req, res) => {

  const user = await User.findOne({ username: req.body.username });
  if (user)
    return res.status(400).send("User already Exists!");

  const newUser = await User.create(req.body);
  res.redirect("/login");
});

app.post("/login", passport.authenticate("local", { failureRedirect: "/login" }), async (req, res) => {
  res.redirect('/main');
});

app.get("/main", isAuthenticated, (req, res) => {
  res.redirect('http://localhost:3001/');
});

app.get("/logout", isAuthenticated, (req, res) => {
  req.logout();
  res.redirect("/");
});



//Whatsapp reminding functionality

const interval = 10000; // Set your desired interval in milliseconds

const checkReminders = async () => {
  try {
    const now = new Date();
    //console.log("Current Time:", now);
    const reminderList = await Reminder.find({ isReminded: false, remindAt: { $lt: now } });
    //console.log("Retrieved Reminders:", reminderList);

    for (const reminder of reminderList) {
      // Mark the reminder as reminded
      const temp = await Reminder.findByIdAndUpdate(reminder._id, { isReminded: true });
      const message = temp.reminderMsg;
      // Send a reminder message
      const accountSid = process.env.ACCOUNT_SID;
      const authToken = process.env.AUTH_TOKEN;
      const client = require('twilio')(accountSid, authToken);

      const result = await client.messages.create({
        body: message,
        from: 'whatsapp:',
        to: 'whatsapp:',
      });
      console.log(result);
    }
  } catch (err) {
    console.error(err);
  }
};

setInterval(checkReminders, interval);



// for reminder application
app.get("/getAllReminder", async (req, res) => {
  try {
    const reminderList = await Reminder.find({});
    res.send(reminderList);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/addReminder", async (req, res) => {
  try {
    const { reminderMsg, remindAt } = req.body;
    const reminder = new Reminder({
      reminderMsg,
      remindAt,
      isReminded: false,
    });

    await reminder.save();

    const reminderList = await Reminder.find({});
    res.send(reminderList);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/deleteReminder", async (req, res) => {
  try {
    const idToDelete = req.body.id;

    // Delete the reminder with the specified ID
    await Reminder.deleteOne({ _id: idToDelete });

    // Fetch the updated reminder list
    const reminderList = await Reminder.find({});
    res.send(reminderList);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});





app.listen(3000, () => {
  console.log('listening on port 3000');
});