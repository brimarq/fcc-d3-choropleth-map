const dataUrl = "";

const usEducationDataUrl = "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json";
const usCountyDataUrl = "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json"; 
let json, req = new XMLHttpRequest();

/** Send http req */
req.open("GET", dataUrl ,true);
req.send();
req.onload = function() {
  json = JSON.parse(req.responseText);
  d3.select("main div#svg-container").text(JSON.stringify(json));
};

