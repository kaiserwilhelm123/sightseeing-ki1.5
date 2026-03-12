let map;
let markers = [];

document.addEventListener("DOMContentLoaded", () => {

map = L.map('map').setView([20,0],2);

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
maxZoom:19
}).addTo(map);

});

async function search(){

const city =
document.getElementById("city").value.trim();

const interestsInput =
document.getElementById("interests").value
.toLowerCase();

const timeInput =
document.getElementById("time").value;

const interests =
interestsInput
? interestsInput.split(",").map(i=>i.trim())
: [];

const maxTime =
timeInput ? timeInput*60 : 9999;

if(!city){

alert("Bitte eine Stadt eingeben");
return;

}

try{

const geoResponse =
await fetch(
`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`,
{
headers:{
"User-Agent":"SightseeingAI-Demo"
}
});

const geoData = await geoResponse.json();

if(geoData.length===0){

alert("Stadt nicht gefunden");
return;

}

const lat = geoData[0].lat;
const lon = geoData[0].lon;

map.setView([lat,lon],13);

markers.forEach(m=>map.removeLayer(m));
markers=[];

const overpassQuery = `
[out:json];
node(around:5000,${lat},${lon})["tourism"];
out;
`;

const placeResponse =
await fetch(
"https://overpass-api.de/api/interpreter",
{
method:"POST",
body:overpassQuery
});

const data =
await placeResponse.json();

const results =
document.getElementById("results");

results.innerHTML="";

let usedTime=0;

let found=false;

data.elements.forEach(place=>{

let name =
place.tags?.name || "Unbekannter Ort";

let category =
place.tags?.tourism || "place";

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

let marker =
L.marker([place.lat,place.lon])
.addTo(map)
.bindPopup(name);

markers.push(marker);

});

if(!found){

results.innerHTML=
"<p>Keine passenden Sehenswürdigkeiten gefunden.</p>";

}

}catch(error){

console.error(error);

alert("Fehler beim Laden der Daten");

}

}
