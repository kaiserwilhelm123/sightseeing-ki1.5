let map;
let markers = [];

document.addEventListener("DOMContentLoaded", () => {

map = L.map('map').setView([20,0],2);

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{maxZoom:19}
).addTo(map);

});

async function search(){

const city = document.getElementById("city").value.trim();
const interestsInput = document.getElementById("interests").value.toLowerCase();
const timeInput = document.getElementById("time").value;

const interests = interestsInput
? interestsInput.split(",").map(i=>i.trim())
: [];

const maxTime = timeInput ? timeInput*60 : 9999;

if(!city){

alert("Bitte eine Stadt eingeben");
return;

}

try{

// Stadtkoordinaten holen
const geoResponse = await fetch(
`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`
);

const geoData = await geoResponse.json();

if(!geoData.length){

alert("Stadt nicht gefunden");
return;

}

const lat = geoData[0].lat;
const lon = geoData[0].lon;

map.setView([lat,lon],13);

// alte Marker löschen
markers.forEach(m=>map.removeLayer(m));
markers=[];

const query = `
[out:json][timeout:25];
(
node["tourism"](around:5000,${lat},${lon});
node["historic"](around:5000,${lat},${lon});
node["attraction"](around:5000,${lat},${lon});
);
out;
`;

const response = await fetch(
"https://overpass-api.de/api/interpreter",
{
method:"POST",
body:query
});

if(!response.ok){

throw new Error("API Fehler");

}

const data = await response.json();

const results = document.getElementById("results");
results.innerHTML="";

let usedTime = 0;
let found = false;

data.elements.forEach(place=>{

let name = place.tags?.name || "Unbekannter Ort";

let category =
place.tags?.tourism ||
place.tags?.historic ||
place.tags?.attraction ||
"Sehenswürdigkeit";

if(interests.length>0){

let match=false;

interests.forEach(i=>{
if(category.includes(i)) match=true;
});

if(!match) return;

}

const visitTime=60;

if(usedTime+visitTime>maxTime)
return;

usedTime+=visitTime;

found=true;

let card=document.createElement("div");
card.className="card";

card.innerHTML=
`<h3>${name}</h3>
<p>Kategorie: ${category}</p>`;

results.appendChild(card);

let marker=L.marker([place.lat,place.lon])
.addTo(map)
.bindPopup(name);

markers.push(marker);

});

if(!found){

results.innerHTML=
"<p>Keine Sehenswürdigkeiten gefunden.</p>";

}

}catch(err){

console.error(err);

alert("Fehler beim Laden der Daten. Bitte nochmal versuchen.");

}

}
