require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const isUrlValid = require("url-validation");
const shortId = require("shortid");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// database connection
mongoose.connect(
  process.env.DATABASE_CONNECTION_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (!err) {
      console.log("connected to DB");
    } else {
      console.log(err);
    }
  }
);

// define url schema
let uriSchema = new mongoose.Schema({
  url_code: String,
  original_url: {
    type: String,
    required: true,
  },
  short_url: {
    type: String,
  },
});

// create url model from urlSchema
let Uri = mongoose.model("Uri", uriSchema);

app.use(cors());

// middlware function will be used for all routes
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", (req, res) => {
  let original_url = req.body.url;
  let hostname = req.headers.host;
  // check if base url is valid or not
  if (isUrlValid(hostname)) {
    res.status(401).json({ error: "invalid url" });
  }

  // check if the requested url is valid or not
  if (isUrlValid(original_url)) {
    // check if url requested url already exists or not
    Uri.findOne({ original_url: original_url }).then((url_object) => {
      if (url_object) {
        console.log("findone block");
        res.json({
          original_url: url_object.original_url,
          short_url: url_object.url_code,
        });
      } else {
        // if the url is valid then we will create a short id
        const url_code = shortId.generate();
        console.log(url_code);
        let short_url = `${hostname}/api/shorturl/${url_code}`;
        let url_object = Uri({
          url_code,
          original_url,
          short_url,
        });
        url_object.save();
        console.log(url_object);
        res.json({
          original_url: url_object.original_url,
          short_url: url_object.url_code,
        });
      }
    });
  } else {
    res.json({ error: "invalid url" });
  }
});

app.get("/api/shorturl/:urlCode", async (req, res) => {
  const code = req.params.urlCode;

  const url_object = await Uri.findOne({ url_code: code });

  if (url_object) {
    return res.redirect(url_object.original_url);
  } else {
    return res.status(404).json({ error: "url not found" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
