const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
	productName: {type: String, required: true },
	companyName: { type: String },
	ean: { type: String },
	upca: { type: String },
	category:{type: String},
	desc:{type: String},
	price_new:{type: String},
	image:{type: String, default: "http://placehold.it/100x100"},
	location:{type: String},
	serialNumber:{type: String, default: "N/A"}, 
	date: { type: Date, default: Date.now }
});

const Item = mongoose.model("Item", ItemSchema);

module.exports = Item;
