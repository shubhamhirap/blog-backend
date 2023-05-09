const express = require("express");
const cors = require("cors");
const { mongoose } = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Post = require("./models/Post");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads/" });
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 4000;

const DB_URL = process.env.DB_URL;

const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const salt = bcrypt.genSaltSync(10);
const secret = "asmasdnkadsnl2l1k2kafghsyabdasdu";

// const corsOptions = {
//   origin: "http://localhost:3000",
//   credentials: true, //access-control-allow-credentials:true
//   optionSuccessStatus: 200,
// };

const corsOptions = {
  origin: "https://bitbrewery.netlify.app",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));

// mongoose.connect("mongodb://localhost:27017/mern-blog");
mongoose
  .connect(DB_URL, connectionParams)
  .then(() => {
    console.info("Connected to db");
  })
  .catch((e) => {
    console.log("Error: ", e);
  });

app.get("/test", (req, res) => {
  res.json("test ok 2");
});

app.post("/register", async (req, res) => {
  const { name, username, password } = req.body;
  try {
    const userDoc = await User.create({
      name,
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch {
    res.status(400).json("Error");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  const passOk = bcrypt.compareSync(password, userDoc.password);

  if (passOk) {
    //logged in
    jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err) throw err;
      res.cookie("token", token).json({
        id: userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json("wrong credentials");
  }
});

app.post("/post", uploadMiddleware.single("file"), async (req, res) => {
  // file
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = `${path}.${ext}`;
  fs.renameSync(path, newPath);

  // author id from cookies
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;

    const { title, summary, content } = req.body;

    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover: newPath,
      author: info.id,
    });

    res.json(postDoc);
  });
});

app.get("/post", async (req, res) => {
  const posts = await Post.find()
    .populate("author", ["name"])
    .sort({ createdAt: -1 })
    .limit(20);
  res.json(posts);
});

app.put("/post", uploadMiddleware.single("file"), async (req, res) => {
  let newPath = null;
  if (req.file) {
    // file
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    newPath = `${path}.${ext}`;
    fs.renameSync(path, newPath);
  }

  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;

    const { id, title, summary, content } = req.body;
    const postDoc = await Post.findById(id);

    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);

    if (!isAuthor) {
      return res.status(400).json("Invalid author");
    }

    await postDoc.updateOne({
      title,
      summary,
      content,
      cover: newPath ? newPath : postDoc.cover,
    });

    res.json(postDoc);
  });
});

app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findById(id).populate("author", ["name"]);
  res.json(postDoc);
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) throw err;
    res.json(info);
  });
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("Ok");
});

//mongodb://localhost:27017

app.listen(PORT);
