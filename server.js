require("dotenv").config();
const express = require("express");
const cors = require("cors");

const auth = require("./routes/auth");
const tasks = require("./routes/tasks");
const youtube = require("./routes/youtube");
const otpRoutes = require("./routes/otp");
const youtubeRoutes = require("./routes/youtube");
const googleOauth = require("./routes/googleOauth");


const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", auth);
app.use("/tasks", tasks);
app.use("/youtube", youtube);
app.use("/otp", otpRoutes);
app.use("/youtube", youtubeRoutes);
app.use("/auth", googleOauth);


app.listen(5000, () =>
  console.log("Backend running on http://localhost:5000")
);
