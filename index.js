
// let json, req = new XMLHttpRequest();

/** Send http req */
// req.open("GET", dataUrl ,true);
// req.send();
// req.onload = function() {
//   json = JSON.parse(req.responseText);
//   d3.select("main div#svg-container").text(JSON.stringify(json));
// };

const usCountyData = "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json"; 

const usEducationData = "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json";

const dataUrls = [usCountyData, usEducationData];

let data = {};

Promise.all(dataUrls.map(url => d3.json(url)))
  .then(function(values) {
    data.geo = values[0];
    data.edu = values[1];
    drawSvg();
  })
;

function drawSvg() {

  console.log(data);

  


}



