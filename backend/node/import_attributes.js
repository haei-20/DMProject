require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Attribute = require('./models/Attribute');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/retail';

const commonColors = ['white','black','red','blue','green','yellow','orange','pink','purple','brown','grey','gray','silver','gold','beige','ivory','navy','maroon','lime','teal'];

function normalize(v){return String(v||'').toLowerCase();}

async function run(){
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const products = await Product.find({}).select('name description').lean();
  console.log(`Loaded ${products.length} products`);

  const colorSet = new Set();

  for(const p of products){
    const text = `${p.name||''} ${p.description||''}`.toLowerCase();
    // check common colors
    for(const c of commonColors){
      if(text.includes(c)) colorSet.add(c.toUpperCase());
    }
    // also capture leading words (e.g., "WHITE HANGING ...")
    const leading = (p.name||'').split(/\s+/).slice(0,2).map(s=>s.replace(/[^A-Za-z]/g,'')).filter(Boolean);
    for(const w of leading){
      if(w.length<=10 && w===w.toUpperCase()){ // all-caps leading words
        colorSet.add(w);
      }
    }
  }

  const values = Array.from(colorSet).sort();
  if(values.length===0){
    console.log('No attribute values found');
    await mongoose.disconnect();
    return;
  }

  // Upsert attribute 'Color'
  let attr = await Attribute.findOne({ name: 'Color' });
  if(!attr){
    attr = new Attribute({ name: 'Color', values });
    await attr.save();
    console.log('Created Attribute Color with', values.length, 'values');
  } else {
    const merged = Array.from(new Set([...(attr.values||[]), ...values]));
    attr.values = merged;
    await attr.save();
    console.log('Updated Attribute Color. Total values:', merged.length);
  }

  await mongoose.disconnect();
}

run().catch(err=>{console.error(err); process.exit(1);});