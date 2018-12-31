
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
    numColors: 11
  };

function drawSvg() {

  console.log(data);
  // NOTE: geodata county object ids correspond to fips in edudata
  

  
  

  
  const counties = topojson.feature(data.geo, data.geo.objects.counties);
  

  function matrix(a, b, c, d, tx, ty) {
    return d3.geoTransform({
      point: function(x, y) {
        this.stream.point(a * x + b * y + tx, c * x + d * y + ty);
      }
    });
  }

  function scaleAndCenter(scaleFactor, width, height) {
    return d3.geoTransform({
        point: function(x, y) {
            this.stream.point( (x - width/2) * scaleFactor + width/2 , (y - height/2) * scaleFactor + height/2);
        }
    });
  }

  // Path for use with matrix transform
  // let path = d3.geoPath().projection(matrix(svgProps.innerWidth / 999.08, 0, 0, .9, svgProps.margin.left, 0));

  // Path for use with scaleAndCenter transform
  // let path = d3.geoPath().projection(scaleAndCenter(0.8, svgProps.outerWidth, svgProps.outerHeight))

  // geoIdentity "projection" for the actual pre-projected topoJSON, in order to scale and position the map
  let projection = d3.geoIdentity()
    .fitExtent([[0, 0],[svgProps.innerWidth, svgProps.innerHeight]], counties)
  ;
  // Path for use with geoIdentity projection
  let path = d3.geoPath().projection(projection);

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
    .style("fill", "#777")
    
  ;


}



