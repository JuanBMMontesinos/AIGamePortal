const cheerio = require("cheerio");

async function debug() {
  const res = await fetch("http://localhost:3000/jogos/gta-6");
  console.log("Status:", res.status);
  const text = await res.text();
  const $ = cheerio.load(text);
  const nextData = $("#__NEXT_DATA__").html();
  if (nextData) {
    console.log("NEXT_DATA:", nextData);
  } else {
    console.log("Full text:", text.slice(0, 2000));
  }
}

debug();
