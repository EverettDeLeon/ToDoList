const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// boilerplate for express, ejs, bodyParser, file system and mongodb
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://admin-ed:55555@cluster0.bnbjc.mongodb.net/todolistDB", {useNewUrlParser: true}, { useUnifiedTopology: true });

// create the item data layout
const itemsSchema = new mongoose.Schema({
    name: String
});

// create model for items based on item schema
const Item = mongoose.model("item", itemsSchema);

// create items within the db
const eat = new Item({
    name: "Eat"
});

const sleep = new Item({
    name: "Sleep"
});

const code = new Item({
    name: "Code"
});

// create an array with all the items you created
const defaultItems = [eat, sleep, code];

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {
    Item.find({}, function(error, foundItems){
        if(foundItems.length === 0){
            // insert that array into the db
            Item.insertMany(defaultItems, function(err){
                if (err) {
                    console.log(err);
                } else {
                    console.log("Added default array into the db.");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });
});

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(error, foundList){
        if (!error){
            if (!foundList){
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    });
});

app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });
    
    if(listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function (error, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }

});


app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId , function(error){
            if(!error){
                console.log("checked item removed from list");
                res.redirect("/");
            } 
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(error, foundList){
            if (!error){
                res.redirect("/" + listName);
            }
        });
    }



});

let port = process.env.PORT;
if (port == null || port == ""){
    port = 3000;
}

app.listen(port, function () {
    console.log("Server has started successfully");
});