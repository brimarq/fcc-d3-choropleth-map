
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

/** Fetch json data, then match and merge corresponding eduData into topoJSON data and draw the svg */
Promise.all(dataUrls.map(url => d3.json(url)))
  .then(function(rcvdData) {
    data = rcvdData[0]; 
    let eduData = rcvdData[1];
    for (let i = 0; i < data.objects.counties.geometries.length; i++) {
      let county = data.objects.counties.geometries[i];
      for (let j = 0; j < eduData.length; j++) {
        let fips = eduData[j].fips;
        if (county.id === fips) {
          county.properties = eduData[j];
          break;
        }
      }
    }
    
    drawSvg();
  })
;

/** Set properties for the svg element */
const svgProps = {};
  svgProps.outerWidth = 1000;
  svgProps.outerHeight = svgProps.outerWidth / 1.6; // 16:10 aspect ratio
  svgProps.margin = {
    top: svgProps.outerHeight * 0.1, 
    right: svgProps.outerWidth * 0.05, 
    bottom: svgProps.outerHeight * 0.05, 
    left: svgProps.outerWidth * 0.05
  };
  svgProps.innerWidth = svgProps.outerWidth - svgProps.margin.left - svgProps.margin.right;
  svgProps.innerHeight = svgProps.outerHeight - svgProps.margin.top - svgProps.margin.bottom;
  svgProps.legend = {
    width: 330,
    height: 20,
    numColors: 8
  };

function drawSvg() {

  console.log(data);
  // NOTE: geodata county object ids correspond to fips in edudata
  
  const counties = topojson.feature(data, data.objects.counties);
  const states = topojson.feature(data, data.objects.states);

  const eduRates = data.objects.counties.geometries.map(x => x.properties.bachelorsOrHigher);

  console.log(d3.extent(eduRates));

  function getThresholdDomain(minValue, maxValue, numGroups) {
    let domainArr = [],
    groupSize = (maxValue - minValue) / numGroups;
    
    for (let i = 0; i < numGroups; i++) {
      domainArr.push(+d3.format(".1~f")(minValue + (groupSize * i)));
    }
    return domainArr;
  }

  const colorScale = d3.scaleThreshold()
    .domain(getThresholdDomain(d3.min(eduRates), d3.max(eduRates), svgProps.legend.numColors))
    .range(d3.schemePurples[svgProps.legend.numColors])
  ;
  

  // function matrix(a, b, c, d, tx, ty) {
  //   return d3.geoTransform({
  //     point: function(x, y) {
  //       this.stream.point(a * x + b * y + tx, c * x + d * y + ty);
  //     }
  //   });
  // }

  // function scaleAndCenter(scaleFactor, width, height) {
  //   return d3.geoTransform({
  //       point: function(x, y) {
  //           this.stream.point( (x - width/2) * scaleFactor + width/2 , (y - height/2) * scaleFactor + height/2);
  //       }
  //   });
  // }

  // Path for use with matrix transform
  // let path = d3.geoPath().projection(matrix(svgProps.innerWidth / 999.08, 0, 0, .9, svgProps.margin.left, 0));

  // Path for use with scaleAndCenter transform
  // let path = d3.geoPath().projection(scaleAndCenter(0.8, svgProps.outerWidth, svgProps.outerHeight))

  // geoIdentity "projection" for the actual pre-projected topoJSON, in order to scale and position the map
  let projection = d3.geoIdentity()
    .fitExtent([[0, 0],[svgProps.innerWidth, svgProps.innerHeight]], counties)
  ;

  // geoIdentity "projection" for the actual pre-projected topoJSON states, in order to scale and position the map
  let projectionStates = d3.geoIdentity()
    .fitExtent([[0, 0],[svgProps.innerWidth, svgProps.innerHeight]], states)
  ;

  // Path for use with geoIdentity projection
  let path = d3.geoPath().projection(projection);
  // Path for use with geoIdentity projection
  let pathStates = d3.geoPath().projection(projectionStates);

  // const projection = 
  // projection default size = 999.08 wide, 583.09 high

  
  


  /** Create svg element */
  const svg = d3.select("main div#svg-container")
    .append("svg")
    .attr("width", svgProps.outerWidth)
    .attr("height", svgProps.outerHeight)
  ;

  /** Create choropleth group */
  const choropleth = svg.append("g")
    .attr("id", "choropleth-map")
    // .style("outline", "1px solid lime")
    .attr("transform", "translate(" + svgProps.margin.left + ", " + svgProps.margin.top + ")")
  ;

  choropleth.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", svgProps.innerWidth)
    .attr("height", svgProps.innerHeight)
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 1)
  ;
  
  choropleth.append("g")
    .attr("id", "counties")
    .style("outline", "1px solid lime")
    .selectAll("path")
    .data(counties.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "county")
    .each(function(d) {
      let fips = d.properties.fips,
        eduRate = d.properties.bachelorsOrHigher
      ;
      d3.select(this).attr("data-fips", fips)
      d3.select(this).attr("data-education", eduRate)
      d3.select(this).style("fill", colorScale(eduRate))
    })
    // .attr("data-fips", function(d) { return d.properties.fips; })
    // .attr("data-education", function(d) { return d.properties.bachelorsOrHigher; })
    // .style("fill", "#777")
    
  ;

  choropleth.append("path")
    .datum(topojson.mesh(data, data.objects.states, function(a, b) { return a.id !== b.id; }))
    .attr("class", "states")
    .attr("fill", "none")
    .attr("d", pathStates)
    .attr("stroke-width", 1)
    .attr("stroke", "white")
  ;


}



