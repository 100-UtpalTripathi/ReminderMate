const mongoose = require('mongoose');

exports.connectMongoose = () => {
  mongoose.connect("mongodb://127.0.0.1:27017/passport", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then((e) => console.log(`Connected to MONGODB : ${e.connection.host}`))
    .catch((e) => console.log(e));
};

const userSchema = new mongoose.Schema({
  name: String,
  username: {
    type: String,
    required: true, unique: true,
  },
  password: String,
});

// for reminder application
const reminderSchema = new mongoose.Schema({
  reminderMsg: String,
  remindAt: String,
  isReminded: Boolean,
});

exports.User = mongoose.model("User", userSchema);
exports.Reminder = mongoose.model("Reminder", reminderSchema);