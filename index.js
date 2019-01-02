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
  top: svgProps.outerHeight * 0.05, 
  right: svgProps.outerWidth * 0.02, 
  bottom: svgProps.outerHeight * 0.02, 
  left: svgProps.outerWidth * 0.02
};
svgProps.innerWidth = svgProps.outerWidth - svgProps.margin.left - svgProps.margin.right;
svgProps.innerHeight = svgProps.outerHeight - svgProps.margin.top - svgProps.margin.bottom;
svgProps.title = {
  x: svgProps.outerWidth / 2,
  y: svgProps.margin.top + 5,
  text1: "United States Educational Attainment (2010-2014)",
  text2: "Adults age 25 and above with a baccalaureate degree or higher",
  color: "#222"
};
svgProps.legend = {
  width: 230,
  height: 8,
  numColors: 9,
  x: svgProps.innerWidth - 250 - 60,
  y: svgProps.margin.top + 15,
};

/** Create hidden tooltip div */
const tooltip = d3.select("body")
  .append("div")
  .attr("id", "tooltip")
  .style("position", "absolute")
  .style("z-index", "10")
  .style("background", "hsla(0, 0%, 0%, .8)")
  .style("visibility", "hidden")
  .each(function() {
    d3.select(this).append("span").attr("id", "area");
    d3.select(this).append("span").attr("id", "education-rate");
  })
;

function drawSvg() {

  const counties = topojson.feature(data, data.objects.counties);

  const eduRates = data.objects.counties.geometries.map(x => x.properties.bachelorsOrHigher);

  const colorScale = d3.scaleThreshold()
    // Domain here uses d3.range(min, max, stepSize)
    .domain(d3.range(...d3.extent(eduRates), (d3.max(eduRates) - d3.min(eduRates)) / svgProps.legend.numColors + 1))
    .range(d3.schemeOranges[svgProps.legend.numColors])
  ;

  // geoIdentity "projection" for the actual pre-projected topoJSON (999.08 wide, 583.09 high), in order to scale and position the map
  let projection = d3.geoIdentity()
    .fitExtent([[0, 0],[svgProps.innerWidth, svgProps.innerHeight]], counties)
  ;

  // Path for use with geoIdentity projection
  let path = d3.geoPath().projection(projection);

  /** Create svg element */
  const svg = d3.select("main div#svg-container")
    .append("svg")
    .attr("width", svgProps.outerWidth)
    .attr("height", svgProps.outerHeight)
  ;

  /** svg title text */
  const titleGroup = svg.append("g")
    .attr("id", "title-group")
    .attr("transform", "translate(" + svgProps.title.x + ", " + svgProps.title.y + ")")
    .style("text-anchor", "middle")
  ;
  titleGroup.append("text")
    .attr("id", "title")
    .attr("fill", svgProps.title.color)
    .style("font-size", "1.25em")
    .style("font-weight", "bold")
    .text(svgProps.title.text1)
  ;
  titleGroup.append("text")
    .attr("id", "description")
    .attr("dy", "1.25em")
    .attr("fill", svgProps.title.color)
    .style("font-weight", "normal")
    .style("font-size", ".8em")
    .text(svgProps.title.text2)
  ;
  
  /** Create choropleth group */
  const choropleth = svg.append("g")
    .attr("id", "choropleth-map")
    .attr("transform", "translate(" + svgProps.margin.left + ", " + svgProps.margin.top + ")")
  ;
  
  /** Draw the counties, bind data, color, mouse events */
  choropleth.append("g")
    .attr("id", "counties")
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
    .on("mouseover", function(d) {
      let dataset = this.dataset
      area = d.properties.area_name + ", " + d.properties.state, 
      eduRate = d.properties.bachelorsOrHigher + "%"
      ;
      
      tooltip
        .style("visibility", "visible")
        .attr("data-education", dataset.education)
        .each(function() {
          d3.select("#area").text(area);
          d3.select("#education-rate").text(eduRate);
        })
      ;
    })
    .on("mousemove", function(d) { 
      tooltip
        .style("top", (d3.event.pageY - 70) + "px")
        .style("left", (d3.event.pageX + 20) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("visibility", "hidden");
    })
  ;

  /** Add state boundaries */
  choropleth.append("path")
    .datum(topojson.mesh(data, data.objects.states, function(a, b) { return a.id !== b.id; }))
    .attr("class", "states")
    .attr("fill", "none")
    .attr("d", path)
    .attr("stroke-width", 1)
    .attr("stroke", "white")
  ;

  /** Legend */
  const legendX = d3.scaleLinear()
    .domain(d3.extent(eduRates))
    .range([0, svgProps.legend.width])
  ;

  const legendXAxis = d3.axisBottom(legendX)
    .tickSize(11)
    .tickValues(colorScale.domain())
    .tickFormat((x) => Math.round(x) + "%")
  ;

  const legend = choropleth.append("g")
    .attr("id", "legend")
    .attr("transform", "translate(" + svgProps.legend.x + ", " + svgProps.legend.y + ")")
  ;

  legend.selectAll("rect")
    .data(colorScale.range().map((d) => {
      d = colorScale.invertExtent(d);
      if (d[0] == null) d[0] = legendX.domain()[0];
      if (d[1] == null) d[1] = legendX.domain()[1];
      return d;
    }))
    .enter()
    .append("rect")
    .attr("x", (d) => legendX(d[0]))
    .attr("y", 0)
    .attr("width", (d) => (legendX(d[1]) - legendX(d[0])))
    .attr("height", svgProps.legend.height)
    .attr("fill", (d) => colorScale(d[0]))
  ;

  legend.append("g").call(legendXAxis);
  // Remove the top line path of the axis
  legend.select("path.domain").remove();

}



