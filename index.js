require("dotenv").config();
const express = require("express")
const session = require("express-session");
const { google } = require("googleapis")
const mongoose = require("mongoose");
const User = require("./models/user");

const app = express();
const googleClient = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI);

app.use(session({
    resave:false,
    saveUninitialized:true,
    secret: process.env.SESSION_SECRET
}))

mongoose.connect(process.env.MONGO_URL, {
    dbName:"signin"
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));


app.get("/", (req, res) => {
    res.render("hello world")
})

app.get("/auth/google", (req, res) => {
    const url = googleClient.generateAuthUrl({
        access_type:"offline",
        scope:[
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email"
        ]
    })
    res.redirect(url)
})

app.get("/auth/google/callback", async (req, res) => {
    try
    {   const { code } = req.query
        const { tokens } = await googleClient.getToken(code)


        googleClient.setCredentials(tokens)

        const oauth2 = google.oauth2({ version: "v2", auth: googleClient });
        const { data } = await oauth2.userinfo.get();

        // Check if user exists
        let user = await User.findOne({ googleId: data.id });

        if (!user) {
            user = new User({
                googleId: data.id,
                name: data.name,
                email: data.email,
                picture: data.picture
            });

            await user.save(); // Save user to MongoDB
        }

        req.session.user = data;
        res.redirect("/dashboard");
    }
    catch(error){
        console.error("Error during authentication", error);
        res.redirect("/");
    }

})

app.get("/dashboard", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    console.log(req.session.user)
    res.send(`Welcome, ${req.session.user.name}! <br> <a href='/logout'>Logout</a>`);
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

app.listen(3000, () => {
    console.log("server running")
})