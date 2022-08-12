require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const validUrl = require("valid-url");
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
let urlSchema = new mongoose.Schema({
  url_code: {
    type: String,
    default: 0,
  },
  original_url: {
    type: String,
    required: true,
  },
  short_url: {
    type: String,
  },
});

// create url model from urlSchema
let Url = mongoose.model("Url", urlSchema);

app.use(cors());

// middlware function will be used for all routes
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// url code incrementer function
const autoIncrementer = (curr) => {
  if (curr == 1) {
    return curr++;
  } else {
    return 1;
  }
};

// Your first API endpoint
app.post("/api/shorturl", (req, res) => {
  let original_url = req.body.url;
  let hostname = req.headers.host;
  // check if base url is valid or not
  if (!validUrl.isUri(hostname)) {
    res.status(401).json({ error: "invalid url" });
  }

  // check if the requested url is valid or not
  if (validUrl.isUri(original_url)) {
    // check if url requested url already exists or not
    Url.findOne({ original_url: original_url }).then((url_object) => {
      if (url_object) {
        console.log("findone block");
        res.json({
          original_url: url_object.original_url,
          short_url: url_object.url_code,
        });
      } else {
        // if the url is valid then we will create a short id
        let url_code;
        if (url_object.url_code) {
          let curr = url_object.url_code;
          url_code = autoIncrementer(curr);
        }

        console.log(url_code);
        let short_url = `${hostname}/api/shorturl/${url_code}`;
        let url_object = Url({
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

  const url_object = await Url.findOne({ url_code: code });

  if (url_object) {
    return res.redirect(url_object.original_url);
  } else {
    return res.status(404).json({ error: "url not found" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
