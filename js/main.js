//declare map var in global scope
var map; //Background map
var mapSymbols; // Proportional Symbols
var mapFeatures; // Feature polygon units
var LegendControl; // Legend
var dataStats = {min:50, max:7000, mean:1000}; //manually created values for the total combined numbers
var centerPoint = [38, -87];
var zoomLevel = 4;

//Declare Database global variables
var currentDB; //current json on map
var currentDBFiltered; //current filtered database if ther is one
var dataSelected = ["combined-database", "state-scale"]
//Declare Filter option global variables
var dataFiltered = false;
var gender = ["Female", "Male"];
var ageFrom = 0;
var ageTo = 120;
var ethnicity = ["American Indian / Alaska Native", "Asian", "Black / African American", "Hawaiian / Pacific Islander", "Hispanic / Latino", "White / Caucasian", "Other", "Uncertain"];
var yearStart = 1900;
var yearEnd = 2020;
var Month = [1,2,3,4,5,6,7,8,9,10,11,12]
//Retrieve Varaibles
var unitSelected;

//Declare API key and other options for OpenCageData geocoder
var options = {
  key: 'c0a1ea5b826c49e0bdfb6831aa2c00b3',
  limit: 5, // number of results to be displayed
  position: 'topright',
  placeholder: 'Search for a place...', // the text in the empty search box
  errorMessage: 'Nothing found.',
  showResultIcons: false,
  collapsed: true,
  expand: 'click',
  addResultToMap: true, // if a map marker should be added after the user clicks a result
  onResultClick: undefined, // callback with result as first parameter
};

// declage array of easy buttons for home and non-contiguous states/territories set views
var buttons = [
  L.easyButton('<img src="img/noun_Home_731233_blk.svg">', function(){
      map.setView([38, -87], 4);
  },'zoom to original extent',{ position: 'topright' }),

  L.easyButton('<span>AK</span>', function(){
      map.setView([65.144912, -152.541399], 3.5);
  },'zoom to Alaska',{ position: 'topright' }),

  L.easyButton('<span>HI</span>', function(){
      map.setView([20.891499, -157.959362], 6.29);
  },'zoom to Hawaii',{ position: 'topright' }),

  L.easyButton('<span>GU</span>', function(){
      map.setView([13.432056, 144.812821], 10.5);
  },'zoom to Guam',{ position: 'topright' }),

  L.easyButton('<span>MP</span>', function(){
      //map.setView([16.530659, 146.027901], 6.35); alternative view of all islands
      map.setView([15.097820, 145.642088], 10.5);
  },'zoom to North Mariana Islands',{ position: 'topright' }),

  L.easyButton('<span>PR</span>', function(){
      map.setView([18.254990, -66.423918], 9.25);
  },'zoom to Puerto Rico',{ position: 'topright' }),

  L.easyButton('<span>VI</span>', function(){
       map.setView([17.970324, -64.727032], 10);
   },'zoom to U.S. Virgin Islands',{ position: 'topright' })
];

///// Functions for Map /////
//Function to instantiate the Leaflet map
function createMap(){
    //create the map
    myBounds = new L.LatLngBounds(new L.LatLng(60, 0), new L.LatLng(30, 0));
    map = L.map('map', {
        zoomControl: false,
        center: centerPoint,
        zoom: zoomLevel,
        minZoom: 3,
        maxZoom: 12,
        maxBounds: [[75, -180], [-30, 180]], // [top, left], [bottom, right]
        attributionControl: false
    });

    // place attribution bar in bottom left of map, instead of default bottom right
    L.control.attribution({position: 'bottomleft'}).addTo(map);

    // Add place searchbar to map
    L.Control.openCageSearch(options).addTo(map);

    // Add zoom control (but in top right)
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // build easy bar from array of easy buttons
    L.easyBar(buttons).addTo(map);

    // Add easy button to pull up splash screen
    L.easyButton('<img src="img/noun_Info_1845673_blk.svg">', function(){
        $('#splash-screen').modal('show');
    },'info window',{ position: 'topright' }).addTo(map);

    //Add OSM base tilelayer
    L.tileLayer('https://api.mapbox.com/styles/v1/pierson/ck9uh6fx202ni1io1459nmyht/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: '<a href="https://www.mapbox.com/">Mapbox</a>',
        accessToken: 'pk.eyJ1IjoicGllcnNvbiIsImEiOiJjanp6c2ZvMjIwZWdjM21waXJpNzhsYTdlIn0.WnrNdPyPhiFYUuoYKF1caw'
    }).addTo(map);

    getData(map);
};

//Import GeoJSON data depending on what info is clicked, select the correct data
function getData(map){
    // Combined Databases
    if (dataSelected[0] === "combined-database" && dataSelected[1] === "state-scale") {
        //Create the enumeration unit boundaries
        $.getJSON("data/JSON/state_poly_counts.json", function(response){
            mapFeatures = L.geoJson(response, {
                style: style,
                onEachFeature: onEachFeature
            })
            .bindTooltip(function (layer) {
                return layer.feature.properties.NAME; //merely sets the tooltip text layer.feature.properties.name
             }, {direction: "center", offset: [0,10],permanent: false, sticky: true, opacity: 0.7, className: "poly-labels"}  //then add your options
            ).addTo(map);
        });
        //load the data
        $.getJSON("data/JSON/summary_counts.json", function(response){
            //create an attributes array
            var attributes = processData(response, "combined"); // attributes = Total Number

            // calcStats(response, "combined");
            createPropSymbols(response, attributes, "combined");
            createLegend(attributes[0], "combined");
        });
    } else if (dataSelected[0] === "combined-database" && dataSelected[1] === "county-scale") {
        //Create the enumeration unit boundaries
        $.getJSON("data/JSON/county_poly_counts.json", function(response){
            mapFeatures = new L.GeoJSON(response, {
                style: style,
                onEachFeature: onEachFeature
            })
            .bindTooltip(function (layer) {
                return layer.feature.properties.NAME; //merely sets the tooltip text layer.feature.properties.NAME
             }, {direction: "center", offset: [0,10],permanent: false, sticky: true, opacity: 0.7, className: "poly-labels"}  //then add your options
            ).addTo(map);
        });
        //load the data
        $.getJSON("data/JSON/county_counts.json", function(response){
            //create an attributes array
            var attributes = processData(response, "combined"); // attributes = Total Number

            // calcStats(response, "combined");
            createPropSymbols(response, attributes, "combined");
            createLegend(attributes[0], "combined");
        });
    } else if (dataSelected[0] === "combined-database" && dataSelected[1] === "city-scale") {
        //load the data
        $.getJSON("data/JSON/city_counts.json", function(response){
            //create an attributes array
            var attributes = processData(response, "combined"); // attributes = Total Number

            // calcStats(response, "combined");
            createPropSymbols(response, attributes, "combined");

            createLegend(attributes[0], "combined");
        });
    // Missing Persons Databases
    } else if (dataSelected[0] === "missing-persons" && dataSelected[1] === "state-scale") {
        //Create the enumeration unit boundaries
        $.getJSON("data/JSON/state_poly_geojson.json", function(response){
            mapFeatures = new L.GeoJSON(response, {
                style: style,
                onEachFeature: onEachFeature,
            })
            .bindTooltip(function (layer) {
                return layer.feature.name; //merely sets the tooltip text layer.feature.name
             }, {direction: "center", offset: [0,10],permanent: false, sticky: true, opacity: 0.7, className: "poly-labels"}  //then add your options
            ).addTo(map);
        });
        //load the data
        $.getJSON("data/JSON/state_geojson.json", function(response){
            //create an attributes array
            var attributes = processData(response, "missing");

            // calcStats(response, "missing");
            createPropSymbols(response, attributes, "missing");
            createLegend(attributes[0], "missing");
        });
    } else if (dataSelected[0] === "missing-persons" && dataSelected[1] === "county-scale") {
        //Create the enumeration unit boundaries
        $.getJSON("data/JSON/county_poly_geojson.json", function(response){
            mapFeatures = new L.GeoJSON(response, {
                style: style,
                onEachFeature: onEachFeature
            })
            .bindTooltip(function (layer) {
                return layer.feature.name; //merely sets the tooltip text layer.feature.name
             }, {direction: "center", offset: [0,10],permanent: false, sticky: true, opacity: 0.7, className: "poly-labels"}  //then add your options
            ).addTo(map);
        });
        //load the data
        $.getJSON("data/JSON/county_geojson.json", function(response){
            //create an attributes array
            var attributes = processData(response, "missing");

            // calcStats(response, "missing");
            createPropSymbols(response, attributes, "missing");
            createLegend(attributes[0], "missing");
        });
    } else if (dataSelected[0] === "missing-persons" && dataSelected[1] === "city-scale") {
        //load the data
        $.getJSON("data/JSON/city_geojson.json", function(response){
            //create an attributes array
            var attributes = processData(response, "missing");

            // calcStats(response, "missing");
            createPropSymbols(response, attributes, "missing");
            createLegend(attributes[0], "missing");
        });
    // Unidentified Persons Databases
    } else if (dataSelected[0] === "unidentified-persons" && dataSelected[1] === "state-scale") {
        //Create the enumeration unit boundaries
        $.getJSON("data/JSON/state_poly_geojson.json", function(response){
            mapFeatures = new L.GeoJSON(response, {
                style: style,
                onEachFeature: onEachFeature
            })
            .bindTooltip(function (layer) {
                return layer.feature.name; //merely sets the tooltip text layer.feature.name
             }, {direction: "center", offset: [0,10],permanent: false, sticky: true, opacity: 0.7, className: "poly-labels"}  //then add your options
            ).addTo(map);
        });
        //load the data
        $.getJSON("data/JSON/state_geojson.json", function(response){
            //create an attributes array
            var attributes = processData(response, "unidentified");

            // calcStats(response, "unidentified");
            createPropSymbols(response, attributes, "unidentified");
            createLegend(attributes[0], "unidentified");
        });
    } else if (dataSelected[0] === "unidentified-persons" && dataSelected[1] === "county-scale") {
        //Create the enumeration unit boundaries
        $.getJSON("data/JSON/county_poly_geojson.json", function(response){
            mapFeatures = new L.GeoJSON(response, {
                style: style,
                onEachFeature: onEachFeature
            })
            .bindTooltip(function (layer) {
                return layer.feature.name; //merely sets the tooltip text layer.feature.name
             }, {direction: "center", offset: [0,10],permanent: false, sticky: true, opacity: 0.7, className: "poly-labels"}  //then add your options
            ).addTo(map);
        });
        //load the data
        $.getJSON("data/JSON/county_geojson.json", function(response){
            //create an attributes array
            var attributes = processData(response, "unidentified");

            // calcStats(response, "unidentified");
            createPropSymbols(response, attributes, "unidentified");
            createLegend(attributes[0], "unidentified");
        });
    } else if (dataSelected[0] === "unidentified-persons" && dataSelected[1] === "city-scale") {
        //load the data
        $.getJSON("data/JSON/city_geojson.json", function(response){
            //create an attributes array
            var attributes = processData(response, "unidentified");

            // calcStats(response, "unidentified");
            createPropSymbols(response, attributes, "unidentified");
            createLegend(attributes[0], "unidentified");
        });
    // Unclaimed Databases
    } else if (dataSelected[0] === "unclaimed-persons" && dataSelected[1] === "state-scale") {
        //Create the enumeration unit boundaries
        $.getJSON("data/JSON/state_poly_geojson.json", function(response){
            mapFeatures = new L.GeoJSON(response, {
                style: style,
                onEachFeature: onEachFeature
            })
            .bindTooltip(function (layer) {
                return layer.feature.name; //merely sets the tooltip text layer.feature.name
             }, {direction: "center", offset: [0,10],permanent: false, sticky: true, opacity: 0.7, className: "poly-labels"}  //then add your options
            ).addTo(map);
        });
        //load the data
        $.getJSON("data/JSON/state_geojson.json", function(response){
            //create an attributes array
            var attributes = processData(response, "unclaimed");

            // calcStats(response, "unclaimed");
            createPropSymbols(response, attributes, "unclaimed");
            createLegend(attributes[0], "unclaimed");
        });
    } else if (dataSelected[0] === "unclaimed-persons" && dataSelected[1] === "county-scale") {
        //Create the enumeration unit boundaries
        $.getJSON("data/JSON/county_poly_geojson.json", function(response){
            mapFeatures = new L.GeoJSON(response, {
                style: style,
                onEachFeature: onEachFeature
            })
            .bindTooltip(function (layer) {
                return layer.feature.name; //merely sets the tooltip text layer.feature.name
             }, {direction: "center", offset: [0,10],permanent: false, sticky: true, opacity: 0.7, className: "poly-labels"}  //then add your options
            ).addTo(map);
        });
        //load the data
        $.getJSON("data/JSON/county_geojson.json", function(response){
            //create an attributes array
            var attributes = processData(response, "unclaimed");

            // calcStats(response, "unclaimed");
            createPropSymbols(response, attributes, "unclaimed");
            createLegend(attributes[0], "unclaimed");
        });
    } else if (dataSelected[0] === "unclaimed-persons" && dataSelected[1] === "city-scale") {
        //load the data
        $.getJSON("data/JSON/city_geojson.json", function(response){
            //create an attributes array
            var attributes = processData(response, "unclaimed");

            // calcStats(response, "unclaimed");
            createPropSymbols(response, attributes, "unclaimed");
            createLegend(attributes[0], "unclaimed");
        });
    }
    // L.control.layers(mapFeatures, mapSymbols).addTo(map);
};

//Set the intial style of the feature units
function style(feature) {
    return {
        fillColor: 'black',
        weight: 1,
        opacity: 1,
        color: 'none',
        fillOpacity: 0
    };
}

//Highlight polygon feature
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 1,
        color: '#fff',
        dashArray: '',
        fillOpacity: 0
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

//Remove polygon feature highlight
function resetHighlight(e) {
    mapFeatures.resetStyle(e.target);
}

// Creates and activates a popup for the polygon feature
function polyPopup(e) {
    var poly = e.target.feature;

    if (dataSelected[1] === "city-scale") return;

    if (dataSelected[0] === "combined-database"){
      //Create the popup content for the combined dataset layer
      var popupContent = createPopupContent(poly.properties);

      //bind the popup to the polygon
      e.target.bindPopup(popupContent, {
          offset: new L.Point(0,0)
      }).openPopup();
    } else {
	    var featureIdentifier = null;

	    if (dataSelected[1] === "state-scale") {
	    	featureIdentifier = "name";
	    } else if (dataSelected[1] === "county-scale") {
	    	featureIdentifier = "county_FIPS";
	    }

    	var keyword = null;

    	if (dataSelected[0] === "missing-persons") {
	    	keyword = "missing";
	    } else if (dataSelected[0] === "unidentified-persons") {
	    	keyword = "unidentified";
	    } else if (dataSelected[0] === "unclaimed-persons") {
	    	keyword = "unclaimed";
	    }

	    unitSelected = poly[featureIdentifier];

      if (dataFiltered) {
        polyPopupFromKeywordFiltered(e, poly, unitSelected, keyword, featureIdentifier)
      } else {
        polyPopupFromKeywordUnfiltered(e, poly, keyword)
      }
   }
}

function polyPopupFromKeywordFiltered(e, poly, unitSelected, keyword, featureIdentifier) {
	//Find the  index in filtered database of the currently selected feature
	var targetIndex = -1;

	for (feature in currentDB.features){
		if (featureIdentifier === "county_FIPS"
			? Number(unitSelected) === Number(currentDB.features[feature][featureIdentifier])
			: unitSelected === currentDB.features[feature][featureIdentifier]
		) {
	    	targetIndex = feature;
	        break;
	  }
	}

	//For each feature, determine its value for the selected attribute
	var attValue = Number(currentDB.features[targetIndex].properties.filtered.length);

	var popupContent = createPopupContentExtra(poly, attValue, keyword);

	//bind the popup to the polygon
	e.target.bindPopup(popupContent, {
	    offset: new L.Point(0,-20)
	}).openPopup();
}

function polyPopupFromKeywordUnfiltered(e, poly, keyword){
	//For each feature, determine its value for the selected attribute
    var attValue = Number(poly.properties[keyword].length);

    var popupContent = createPopupContentExtra(poly, attValue, keyword);

    //bind the popup to the polygon
    e.target.bindPopup(popupContent, {
        offset: new L.Point(0,-20)
    }).openPopup();
}

//Event listeners for highlighing the polygon features
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: polyPopup
    });
}

//Get Data for filtered
function getDataFiltered(map){
    if (dataSelected[1] === "state-scale") {
        //Create the enumeration unit boundaries
        $.getJSON("data/JSON/state_poly_geojson.json", function(response){
            mapFeatures = new L.GeoJSON(response, {
                style: style,
                onEachFeature: onEachFeature
            })
            .bindTooltip(function (layer) {
                return layer.feature.name; //merely sets the tooltip text layer.feature.name
             }, {direction: "center", offset: [0,10],permanent: false, sticky: true, opacity: 0.7, className: "poly-labels"}  //then add your options
            ).addTo(map);
        });
    } else if (dataSelected[1] === "county-scale") {
        //Create the enumeration unit boundaries
        $.getJSON("data/JSON/county_poly_geojson.json", function(response){
            mapFeatures = new L.GeoJSON(response, {
                style: style,
                onEachFeature: onEachFeature
            })
            .bindTooltip(function (layer) {
                return layer.feature.name; //merely sets the tooltip text layer.feature.name
             }, {direction: "center", offset: [0,10],permanent: false, sticky: true, opacity: 0.7, className: "poly-labels"}  //then add your options
            ).addTo(map);
        });
    }

    //load the data
    //create an attributes array
    var attributes = processData(currentDB, "filtered");

    // calcStats(currentDB, "filtered");
    createPropSymbols(currentDB, attributes, "filtered");
    createLegend(currentDB[0], "filtered");
}

//Build an attributes array from the special data
function processData(data, keyword){
    //empty array to hold attributes
    var attributes = [];
    //empty variable to store properties
    var currentProperties;

    //properties of the first feature in the dataset
    if (keyword === "combined") {
        //assign current json to global variable for filtering
        currentDB = data;

        //properties of the first feature in the dataset
        currentProperties = data.features[0].properties;

        //push each attribute name into attributes array
        for (var attribute in currentProperties){
            //only take attributes with keyword values
            if (attribute.indexOf("Total_Count") > -1){
                attributes.push(attribute);
            };
        };
    } else if (keyword === "missing") {
        //assign current json to global variable for filtering
        currentDB = data;

        currentProperties = data.features[0].properties.missing;

        //push each attribute into attributes array
        for (var attribute in currentProperties){
            attributes.push(attribute);
        };
    } else if (keyword === "unclaimed") {
        //assign current json to global variable for filtering
        currentDB = data;

        currentProperties = data.features[0].properties.unclaimed;

        //push each attribute into attributes array
        for (var attribute in currentProperties){
            attributes.push(attribute);
        };
    } else if (keyword === "unidentified") {
        //assign current json to global variable for filtering
        currentDB = data;

        currentProperties = data.features[0].properties.unidentified;

        //push each attribute into attributes array
        for (var attribute in currentProperties){
            attributes.push(attribute);
        };
    } else if (keyword === "filtered") {

        currentProperties = data.features[0].properties.filtered;

        //push each attribute into attributes array
        for (var attribute in currentProperties){
            attributes.push(attribute);
        };
    }

    return attributes;
};

// Add circle markers for point features to the map
function createPropSymbols(data, attributes, keyword){

    //create a Leaflet GeoJSON layer and add it to the map
    mapSymbols = L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes, keyword);
        }
    }).addTo(map);
};

//Convert markers to circle markers
function pointToLayer(feature, latlng, attributes, keyword){
    // Determine which attribute to visualize with proportional symbols
    //Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];

    if (keyword == "combined"){
        // create hover label content
        var hoverLabel = feature.properties.CITY_NAME

        //create marker options
        var options = {
            fillColor: "#78BFA5",
            color: "#000",
            weight: 0.5,
            opacity: 1,
            fillOpacity: 0.8
        };

        //For each feature, determine its value for the selected attribute
        var attValue = Number(feature.properties[attribute]);

        //Create the popup content for the combined dataset layer
        var popupContent = createPopupContent(feature.properties, attribute);
    } else if (keyword == "missing"){
        // create hover label content
        var hoverLabel = feature.name

        //create marker options
        var options = {
            fillColor: "#66A3D9",
            color: "#000",
            weight: 0.5,
            opacity: 1,
            fillOpacity: 0.8
        };
        //For each feature, determine its value for the selected attribute
        var attValue = Number(feature.properties.missing.length);

        var popupContent = createPopupContentExtra(feature, attValue, keyword);
    } else if (keyword == "unidentified"){
        // create hover label content
        var hoverLabel = feature.name

        //create marker options
        var options = {
            fillColor: "#F2B872",
            color: "#000",
            weight: 0.5,
            opacity: 1,
            fillOpacity: 0.8
        };
        //For each feature, determine its value for the selected attribute
        var attValue = Number(feature.properties.unidentified.length);

        var popupContent = createPopupContentExtra(feature, attValue, keyword);
    } else if (keyword == "unclaimed"){
        // create hover label content
        var hoverLabel = feature.name

        //create marker options
        var options = {
            fillColor: "#D96A6A",
            color: "#000",
            weight: 0.5,
            opacity: 1,
            fillOpacity: 0.8
        };
        //For each feature, determine its value for the selected attribute
        var attValue = Number(feature.properties.unclaimed.length);

        var popupContent = createPopupContentExtra(feature, attValue, keyword);
    } else if (keyword == "filtered"){
        // create hover label content
        var hoverLabel = feature.name

        //create marker options
        if (dataSelected[0] === "missing-persons") {
            var options = {
                fillColor: "#66A3D9",
                color: "#000",
                weight: 0.5,
                opacity: 1,
                fillOpacity: 0.8
            };
        } else if (dataSelected[0] === "unidentified-persons") {
            var options = {
                fillColor: "#F2B872",
                color: "#000",
                weight: 0.5,
                opacity: 1,
                fillOpacity: 0.8
            };
        } else if (dataSelected[0] === "unclaimed-persons") {
            var options = {
                fillColor: "#D96A6A",
                color: "#000",
                weight: 0.5,
                opacity: 1,
                fillOpacity: 0.8
            };
        }

        //For each feature, determine its value for the selected attribute
        var attValue = Number(feature.properties.filtered.length);

        var popupContent = createPopupContentExtra(feature, attValue, keyword);
    }

    //Give each feature's circle marker a radius based on its attribute value
    if (attValue > 0) {
        options.radius = calcPropRadius(attValue, keyword);
    } else  if (attValue == 0) {
        var options = {
            radius: 0,
            fillColor: "#ffffff",
            color: "#000",
            weight: 1,
            opacity: 0,
            fillOpacity: 0,
            // display: none
        };
    }

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

        //bind the popup to the circle marker if its a city
    if (dataSelected[1] === "city-scale") {
        layer.bindPopup(popupContent, {
            offset: new L.Point(0,(-options.radius)/2)
        }).bindTooltip(hoverLabel, {direction: "center", offset: [0,10],permanent: false, sticky: true, opacity: 0.9, className: "poly-labels"}  //then add your options
        );
    }

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

// Creates text for the popups in the prop symbols
function createPopupContentExtra(feature, attValue, keyword){
    //add name to popup content string
    if (dataSelected[1] === "city-scale") {
        var popupContent = "<p class='popup-feature-name'><b>" + feature.name + ", " + feature.state_abbr + "</b></p>";
    } else if (dataSelected[1] === "county-scale") {
        var popupContent = "<p class='popup-feature-name'><b>" + feature.name + " County</b></p>";
    } else {
        var popupContent = "<p class='popup-feature-name'><b>" + feature.name + "</b></p>";
    }

    //add formatted attribute to panel content string
    if (dataSelected[0] === "missing-persons") {
        popupContent += "<p class='popup-record-count'>Number of <span id='missing-record'><b>Missing</b></span> Persons Records: <b><span id='missing-record'>" +attValue + "</span></b></p>";

    } else if (dataSelected[0] === "unidentified-persons") {
        popupContent += "<p class='popup-record-count'>Number of <span id='unidentified-record'><b>Unidentified</b></span> Persons Records: <b><span id='unidentified-record'>" +attValue + "</span></b></p>";

    } else if (dataSelected[0] === "unclaimed-persons") {
        popupContent += "<p class='popup-record-count'>Number of <span id='unclaimed-record'><b>Unclaimed</b></span> Persons Records: <b><span id='unclaimed-record'>" +attValue + "</span></b></p>";

    } else if (keyword === "filtered") {
        popupContent += "<p class='popup-record-count'>Number of Filtered Persons Records: <b>" +attValue + "</b></p>";

    }
    // if the scale is not set to city, allow retrieval
    if (dataSelected[1] !== "city-scale") {
        popupContent += '<a class="retrieveNames" href="#" style="color: #6e6e6e; font-style: italic">Click to Retrieve List of Records below Map</a>'
    }
    return popupContent;
};

// Creates text for the popups in the prop symbols
function createPopupContent(properties, attribute){
    //add name to popup content string
    if (dataSelected[1] === "city-scale") {
        var popupContent = "<p class='popup-feature-name'><b>" + properties.CITY_NAME + ", " + properties.STUSPS + "</b></p>";

        //get combined record number
        var combined = properties[attribute];
        //get missing persons record number
        var missing;
        if (properties.Missing_Count == null){
            missing = 0;
        } else {
            missing = properties.Missing_Count;
        }
        //get unidentified persons record number
        var unidentified;
        if (properties.Unidentified_Count == null){
            unidentified = 0;
        } else {
            unidentified = properties.Unidentified_Count;
        }
        //get unclaimed persons record number
        var unclaimed;
        if (properties.Unclaimed_Count == null){
            unclaimed = 0;
        } else {
            unclaimed = properties.Unclaimed_Count;
        }

        //add formatted attribute to panel content string
        popupContent += "<p class='popup-record-count'>Number of <span id='combined-record'><b>Combined</b></span> Dataset Records: <b><span id='combined-record'>" + combined + "</span></b></p>";
        popupContent += "<p class='popup-record-count'>Number of <span id='missing-record'><b>Missing</b></span> Persons Records: <b><span id='missing-record'>" + missing + "</span></b></p>";
        popupContent += "<p class='popup-record-count'>Number of <span id='unidentified-record'><b>Unidentified</b></span> Persons Records: <b><span id='unidentified-record'>" + unidentified + "</span></b></p>";
        popupContent += "<p class='popup-record-count'>Number of <span id='unclaimed-record'><b>Unclaimed</b></span> Persons Records: <b><span id='unclaimed-record'>" + unclaimed + "</span></b></p>";

        return popupContent;

    } else if (dataSelected[1] === "county-scale") {
        var popupContent = "<p class='popup-feature-name'><b>" + properties.NAME + " County</b></p>";
    } else {
        var popupContent = "<p class='popup-feature-name'><b>" + properties.NAME + "</b></p>";
    }

    //get combined record number
    var combined = properties.Total_Count;
    //get missing persons record number
    var missing;
    if (properties.Missing_Count == null){
        missing = 0;
    } else {
        missing = properties.Missing_Count;
    }
    //get unidentified persons record number
    var unidentified;
    if (properties.Unidentified_Count == null){
        unidentified = 0;
    } else {
        unidentified = properties.Unidentified_Count;
    }
    //get unclaimed persons record number
    var unclaimed;
    if (properties.Unclaimed_Count == null){
        unclaimed = 0;
    } else {
        unclaimed = properties.Unclaimed_Count;
    }

    //add formatted attribute to panel content string
    popupContent += "<p class='popup-record-count'>Number of <span id='combined-record'><b>Combined</b></span> Dataset Records: <b><span id='combined-record'>" + combined + "</span></b></p>";
    popupContent += "<p class='popup-record-count'>Number of <span id='missing-record'><b>Missing</b></span> Persons Records: <b><span id='missing-record'>" + missing + "</span></b></p>";
    popupContent += "<p class='popup-record-count'>Number of <span id='unidentified-record'><b>Unidentified</b></span> Persons Records: <b><span id='unidentified-record'>" + unidentified + "</span></b></p>";
    popupContent += "<p class='popup-record-count'>Number of <span id='unclaimed-record'><b>Unclaimed</b></span> Persons Records: <b><span id='unclaimed-record'>" + unclaimed + "</span></b></p>";

    return popupContent;

};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue, keyword) {
    if (dataSelected[1] === "state-scale") {
        if (keyword === "combined"){
            // Picked values that look normal
            var minValue = 10;
            //constant factor adjusts symbol sizes evenly
            var minRadius = 1.5;
        } else if (keyword === "missing") {
            // Picked values that look normal
            var minValue = 5;
            //constant factor adjusts symbol sizes evenly
            var minRadius = 1.8;
        } else if (keyword === "unidentified") {
            // Picked values that look normal
            var minValue = 5;
            //constant factor adjusts symbol sizes evenly
            var minRadius = 1.8;
        } else if (keyword === "unclaimed") {
            // Picked values that look normal
            var minValue = 5;
            //constant factor adjusts symbol sizes evenly
            var minRadius = 1.5;
        } else {
            // Picked values that look normal
            var minValue = 5;
            //constant factor adjusts symbol sizes evenly
            var minRadius = 1.5;
        }
    } else if (dataSelected[1] === "county-scale") {
        if (keyword === "combined"){
            // Picked values that look normal
            var minValue = 2;
            //constant factor adjusts symbol sizes evenly
            var minRadius = 1.5;
        } else if (keyword === "missing") {
            // Picked values that look normal
            var minValue = 1;
            //constant factor adjusts symbol sizes evenly
            var minRadius = 1.5;
        } else if (keyword === "unidentified") {
            // Picked values that look normal
            var minValue = 1;
            //constant factor adjusts symbol sizes evenly
            var minRadius = 1.3;
        } else if (keyword === "unclaimed") {
            // Picked values that look normal
            var minValue = 1;
            //constant factor adjusts symbol sizes evenly
            var minRadius = 1.3;
        } else {
            // Picked values that look normal
            var minValue = 1;
            //constant factor adjusts symbol sizes evenly
            var minRadius = 1.5;
        }
    } else if (dataSelected[1] === "city-scale") {
        if (keyword === "combined"){
            // Picked values that look normal
            var minValue = 1;
            //constant factor adjusts symbol sizes evenly
            var minRadius = 1.3;
        } else if (keyword === "missing") {
            // Picked values that look normal
            var minValue = 1;
            //constant factor adjusts symbol sizes evenly
            var minRadius = 1.5;
        } else if (keyword === "unidentified") {
            // Picked values that look normal
            var minValue = 1;
            //constant factor adjusts symbol sizes evenly
            var minRadius = 1.8;
        } else if (keyword === "unclaimed") {
            // Picked values that look normal
            var minValue = 1;
            //constant factor adjusts symbol sizes evenly
            var minRadius = 1.7;
        } else {
            // Picked values that look normal
            var minValue = 1;
            //constant factor adjusts symbol sizes evenly
            var minRadius = 1.5;
        }
    }

    //Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius;

    return radius;
};

//Calculate the max, mean, min values of the dataset. /// Currently not being used as these values are hardcoded. ///
function calcStats(data, keyword){
    //create empty array to store all data values
    var allValues = [];

    if(keyword === "combined"){
        //loop through each unit
        for(var unit of data.features){
            //get number of records
            var value = unit.properties.Total_Count;
            //add value to array
            allValues.push(value);
        }
    } else if (keyword === "missing"){
        //Loop through each enumeration area
        for (eachArea in data.features){
            //Loop through each record
            for (eachRecord in data.features[eachArea].properties.missing){
                //get number of records
                var value = data.features[eachArea].properties.missing.length;
                //add value to array
                allValues.push(value);
            }
        }
    } else if (keyword === "unidentified"){
        //Loop through each enumeration area
        for (eachArea in data.features){
            //Loop through each record
            for (eachRecord in data.features[eachArea].properties.unidentified){
                //get number of records
                var value = data.features[eachArea].properties.unidentified.length;
                //add value to array
                allValues.push(value);
            }
        }
    } else if (keyword === "unclaimed"){
        //Loop through each enumeration area
        for (eachArea in data.features){
            //Loop through each record
            for (eachRecord in data.features[eachArea].properties.unclaimed){
                //get number of records
                var value = data.features[eachArea].properties.unclaimed.length;
                //add value to array
                allValues.push(value);
            }
        }
    } else if (keyword === "filtered"){
        //Loop through each enumeration area
        for (eachArea in data.features){
            //Loop through each record
            for (eachRecord in data.features[eachArea].properties.filtered){
                //get number of records
                var value = data.features[eachArea].properties.unidentified.filtered;
                //add value to array
                allValues.push(value);
            }
        }
    }

    //get min, max, mean stats for our array
    dataStats.min = Math.min(...allValues)
    dataStats.max = Math.max(...allValues);

    //calculate mean
    var sum = allValues.reduce(function(a, b){return a+b;});
    dataStats.mean = sum/ allValues.length;
}

//Create the legend of proportional symbols set to the defined max, min, mean in the "dataStats" global varaible
function createLegend(attribute, keyword){
    LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            if (keyword === "combined"){
                if (dataSelected[1] === "state-scale") {
                    dataStats = {min:50, max:7000, mean:2000};
                    $(container).append('<h3 id="legend-title" ><b><span id="combined-record">Combined</span> Database</b></h3>');
                    $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                    //Start attribute legend svg string
                    var svg = '<svg id="attribute-legend" width="270px" height="150px">';

                    //array of circle names to base loop on
                    var circles = ["max", "mean", "min"];

                    //Loop to add each circle and text to svg string
                    for (var i=0; i<circles.length; i++){
                        //Assign the r and cy attributes
                        var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                        var cy = (180 - radius) -40;

                        //circle string
                        svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#78BFA5" fill-opacity="1" stroke="#000000" cx="88"/>';

                        //evenly space out labels
                        if (i < 1) {
                          var textY = 25; //spacing + y value
                        } else if (i == 1) {
                          var textY = 85; //spacing + y value
                        } else if (i == 2) {
                          var textY = 135; //spacing + y value
                        }

                        //text string
                        svg += '<text id="' + circles[i] + '-text" x="172" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                    };
                } else if (dataSelected[1] === "county-scale"){
                    dataStats = {min:10, max:1700, mean:300}; //manually created values for the total combined numbers

                    $(container).append('<h3 id="legend-title" ><b><span id="combined-record">Combined</span> Databases</b></h3>');
                    $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                    //Start attribute legend svg string
                    var svg = '<svg id="attribute-legend" width="270px" height="150px">'; // 251 160

                    //array of circle names to base loop on
                    var circles = ["max", "mean", "min"];

                    //Loop to add each circle and text to svg string
                    for (var i=0; i<circles.length; i++){
                        //Assign the r and cy attributes
                        var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                        var cy = (180 - radius) -35;

                        //circle string
                        svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#78BFA5" fill-opacity="1" stroke="#000000" cx="88"/>';

                        //evenly space out labels
                        if (i < 1) {
                          var textY = 15; //spacing + y value
                        } else if (i == 1) {
                          var textY = 100; //spacing + y value
                        } else if (i == 2) {
                          var textY = 140; //spacing + y value
                        }


                        //text string
                        svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                    };

                    //close svg string
                    svg += "</svg>";
                } else if (dataSelected[1] === "city-scale"){
                    dataStats = {min:5, max:1000, mean:200}; //manually created values for the total combined numbers

                    $(container).append('<h3 id="legend-title" ><b><span id="combined-record">Combined</span> Databases</b></h3>');
                    $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                    //Start attribute legend svg string
                    var svg = '<svg id="attribute-legend" width="270px" height="150px">'; //245 150

                    //array of circle names to base loop on
                    var circles = ["max", "mean", "min"];

                    //Loop to add each circle and text to svg string
                    for (var i=0; i<circles.length; i++){
                        //Assign the r and cy attributes
                        var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                        var cy = (180 - radius) -35;

                        //circle string
                        svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#78BFA5" fill-opacity="1" stroke="#000000" cx="88"/>';

                        //evenly space out labels
                        if (i < 1) {
                          var textY = 20; //spacing + y value
                        } else if (i == 1) {
                          var textY = 96; //spacing + y value
                        } else if (i == 2) {
                          var textY = 140; //spacing + y value
                        }

                        //text string
                        svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                    };

                    //close svg string
                    svg += "</svg>";
                }
            } else if (keyword === "missing"){
                if (dataSelected[1] === "state-scale") {
                    dataStats = {min:50, max:2500, mean:1000}; //manually created values for the total combined numbers

                    $(container).append('<h3 id="legend-title" ><b><span id="missing-record">Missing</span> Persons</b></h3>');
                    $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                    //Start attribute legend svg string
                    var svg = '<svg id="attribute-legend" width="270px" height="150px">'; //245 150

                    //array of circle names to base loop on
                    var circles = ["max", "mean", "min"];

                    //Loop to add each circle and text to svg string
                    for (var i=0; i<circles.length; i++){
                        //Assign the r and cy attributes
                        var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                        var cy = (180 - radius) -40;

                        //circle string
                        svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#66A3D9" fill-opacity="1" stroke="#000000" cx="88"/>';

                        //evenly space out labels
                        var textY = i * 50 + 28; //spacing + y value

                        //text string
                        svg += '<text id="' + circles[i] + '-text" x="175" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                    };

                    //close svg string
                    svg += "</svg>";
                } else if (dataSelected[1] === "county-scale"){
                    dataStats = {min:10, max:600, mean:200}; //manually created values for the total combined numbers

                    $(container).append('<h3 id="legend-title" ><b><span id="missing-record">Missing</span> Persons</b></h3>');
                    $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                    //Start attribute legend svg string
                    var svg = '<svg id="attribute-legend" width="270px" height="150px">'; //230 150

                    //array of circle names to base loop on
                    var circles = ["max", "mean", "min"];

                    //Loop to add each circle and text to svg string
                    for (var i=0; i<circles.length; i++){
                        //Assign the r and cy attributes
                        var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                        var cy = (180 - radius) -40;

                        //circle string
                        svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#66A3D9" fill-opacity="1" stroke="#000000" cx="88"/>';

                        //evenly space out labels
                        var textY = i * 50 + 32; //spacing + y value

                        //text string
                        svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                    };

                    //close svg string
                    svg += "</svg>";
                } else if (dataSelected[1] === "city-scale"){
                    dataStats = {min:5, max:250, mean:100}; //manually created values for the total combined numbers

                    $(container).append('<h3 id="legend-title" ><b><span id="missing-record">Missing</span> Persons</b></h3>');
                    $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                    //Start attribute legend svg string
                    var svg = '<svg id="attribute-legend" width="205px" height="100px">'; //188 100

                    //array of circle names to base loop on
                    var circles = ["max", "mean", "min"];

                    //Loop to add each circle and text to svg string
                    for (var i=0; i<circles.length; i++){
                        //Assign the r and cy attributes
                        var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                        var cy = (180 - radius) -90;

                        //circle string
                        svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#66A3D9" fill-opacity="1" stroke="#000000" cx="53"/>';

                        //evenly space out labels
                        var textY = i * 27 + 28; //spacing + y value

                        //text string
                        svg += '<text id="' + circles[i] + '-text" x="118" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                    };

                    //close svg string
                    svg += "</svg>";
                }
            } else if (keyword === "unidentified"){
                if (dataSelected[1] === "state-scale") {
                    dataStats = {min:10, max:2700, mean:1000}; //manually created values for the total combined numbers

                    $(container).append('<h3 id="legend-title" ><b><span id="unidentified-record">Unidentified</span> Persons</b></h3>');
                    $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                    //Start attribute legend svg string
                    var svg = '<svg id="attribute-legend" width="270px" height="150px">';

                    //array of circle names to base loop on
                    var circles = ["max", "mean", "min"];

                    //Loop to add each circle and text to svg string
                    for (var i=0; i<circles.length; i++){
                        //Assign the r and cy attributes
                        var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                        var cy = (180 - radius) -40;

                        //circle string
                        svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#F2B872" fill-opacity="1" stroke="#000000" cx="88"/>';

                        //evenly space out labels
                        var textY = i * 50 + 32; //spacing + y value

                        //text string
                        svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                    };

                    //close svg string
                    svg += "</svg>";
                } else if (dataSelected[1] === "county-scale"){
                    dataStats = {min:5, max:1000, mean:300}; //manually created values for the total combined numbers

                    $(container).append('<h3 id="legend-title" ><b><span id="unidentified-record">Unidentified</span> Persons</b></h3>');
                    $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                    //Start attribute legend svg string
                    var svg = '<svg id="attribute-legend" width="270px" height="150px">';

                    //array of circle names to base loop on
                    var circles = ["max", "mean", "min"];

                    //Loop to add each circle and text to svg string
                    for (var i=0; i<circles.length; i++){
                        //Assign the r and cy attributes
                        var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                        var cy = (180 - radius) -40;

                        //circle string
                        svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#F2B872" fill-opacity="1" stroke="#000000" cx="88"/>';

                        //evenly space out labels
                        var textY = i * 50 + 32; //spacing + y value

                        //text string
                        svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                    };

                    //close svg string
                    svg += "</svg>";
                } else if (dataSelected[1] === "city-scale"){
                    dataStats = {min:5, max:500, mean:100}; //manually created values for the total combined numbers

                    $(container).append('<h3 id="legend-title" ><b><span id="unidentified-record">Unidentified</span> Persons</b></h3>');
                    $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                    //Start attribute legend svg string
                    var svg = '<svg id="attribute-legend" width="270px" height="150px">';

                    //array of circle names to base loop on
                    var circles = ["max", "mean", "min"];

                    //Loop to add each circle and text to svg string
                    for (var i=0; i<circles.length; i++){
                        //Assign the r and cy attributes
                        var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                        var cy = (180 - radius) -40;

                        //circle string
                        svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#F2B872" fill-opacity="1" stroke="#000000" cx="88"/>';

                        //evenly space out labels
                        var textY = i * 50 + 32; //spacing + y value

                        //text string
                        svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                    };

                    //close svg string
                    svg += "</svg>";
                }
            } else if (keyword === "unclaimed"){
                if (dataSelected[1] === "state-scale") {
                    dataStats = {min:10, max:3000, mean:1500}; //manually created values for the total combined numbers

                    $(container).append('<h3 id="legend-title" ><b><span id="unclaimed-record">Unclaimed</span> Persons</b></h3>');
                    $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                    //Start attribute legend svg string
                    var svg = '<svg id="attribute-legend" width="270px" height="150px">';

                    //array of circle names to base loop on
                    var circles = ["max", "mean", "min"];

                    //Loop to add each circle and text to svg string
                    for (var i=0; i<circles.length; i++){
                        //Assign the r and cy attributes
                        var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                        var cy = (180 - radius) -40;

                        //circle string
                        svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#D96A6A" fill-opacity="1" stroke="#000000" cx="88"/>';

                        //evenly space out labels
                        var textY = i * 50 + 32; //spacing + y value

                        //text string
                        svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                    };

                    //close svg string
                    svg += "</svg>";
                } else if (dataSelected[1] === "county-scale"){
                    dataStats = {min:5, max:1000, mean:300}; //manually created values for the total combined numbers

                    $(container).append('<h3 id="legend-title" ><b><span id="unclaimed-record">Unclaimed</span> Persons</b></h3>');
                    $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                    //Start attribute legend svg string
                    var svg = '<svg id="attribute-legend" width="270px" height="150px">';

                    //array of circle names to base loop on
                    var circles = ["max", "mean", "min"];

                    //Loop to add each circle and text to svg string
                    for (var i=0; i<circles.length; i++){
                        //Assign the r and cy attributes
                        var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                        var cy = (180 - radius) -40;

                        //circle string
                        svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#D96A6A" fill-opacity="1" stroke="#000000" cx="88"/>';

                        //evenly space out labels
                        var textY = i * 50 + 32; //spacing + y value

                        //text string
                        svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                    };

                    //close svg string
                    svg += "</svg>";
                } else if (dataSelected[1] === "city-scale"){
                    dataStats = {min:5, max:600, mean:200}; //manually created values for the total combined numbers

                    $(container).append('<h3 id="legend-title" ><b><span id="unclaimed-record">Unclaimed</span> Persons</b></h3>');
                    $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                    //Start attribute legend svg string
                    var svg = '<svg id="attribute-legend" width="270px" height="150px">';

                    //array of circle names to base loop on
                    var circles = ["max", "mean", "min"];

                    //Loop to add each circle and text to svg string
                    for (var i=0; i<circles.length; i++){
                        //Assign the r and cy attributes
                        var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                        var cy = (180 - radius) -40;

                        //circle string
                        svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#D96A6A" fill-opacity="1" stroke="#000000" cx="88"/>';

                        //evenly space out labels
                        var textY = i * 50 + 32; //spacing + y value

                        //text string
                        svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                    };

                    //close svg string
                    svg += "</svg>";
                }
            } else if (keyword === "filtered"){
                if (dataSelected[0] === "missing-persons"){
                    if (dataSelected[1] === "state-scale") {
                        dataStats = {min:50, max:2500, mean:1000}; //manually created values for the total combined numbers

                        $(container).append('<h3 id="legend-title" ><b><span id="missing-record">Missing Persons</span></b></h3>');
                        $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                        //Start attribute legend svg string
                        var svg = '<svg id="attribute-legend" width="270px" height="150px">';

                        //array of circle names to base loop on
                        var circles = ["max", "mean", "min"];

                        //Loop to add each circle and text to svg string
                        for (var i=0; i<circles.length; i++){
                            //Assign the r and cy attributes
                            var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                            var cy = (180 - radius) -40;

                            //circle string
                            svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#66A3D9" fill-opacity="1" stroke="#000000" cx="88"/>';

                            //evenly space out labels
                            var textY = i * 50 + 32; //spacing + y value

                            //text string
                            svg += '<text id="' + circles[i] + '-text" x="175" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                        };

                        //close svg string
                        svg += "</svg>";
                    } else if (dataSelected[1] === "county-scale"){
                        dataStats = {min:10, max:600, mean:200}; //manually created values for the total combined numbers

                        $(container).append('<h3 id="legend-title" ><b><span id="missing-record">Missing</span> Persons</b></h3>');
                        $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                        //Start attribute legend svg string
                        var svg = '<svg id="attribute-legend" width="270px" height="150px">';

                        //array of circle names to base loop on
                        var circles = ["max", "mean", "min"];

                        //Loop to add each circle and text to svg string
                        for (var i=0; i<circles.length; i++){
                            //Assign the r and cy attributes
                            var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                            var cy = (180 - radius) -40;

                            //circle string
                            svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#66A3D9" fill-opacity="1" stroke="#000000" cx="88"/>';

                            //evenly space out labels
                            var textY = i * 50 + 32; //spacing + y value

                            //text string
                            svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                        };

                        //close svg string
                        svg += "</svg>";
                    } else if (dataSelected[1] === "city-scale"){
                        dataStats = {min:5, max:250, mean:100}; //manually created values for the total combined numbers

                        $(container).append('<h3 id="legend-title" ><b><span id="missing-record">Missing</span> Persons</b></h3>');
                        $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                        //Start attribute legend svg string
                        var svg = '<svg id="attribute-legend" width="205px" height="100px">';

                        //array of circle names to base loop on
                        var circles = ["max", "mean", "min"];

                        //Loop to add each circle and text to svg string
                        for (var i=0; i<circles.length; i++){
                            //Assign the r and cy attributes
                            var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                            var cy = (180 - radius) -90;

                            //circle string
                            svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#66A3D9" fill-opacity="1" stroke="#000000" cx="53"/>';

                            //evenly space out labels
                            var textY = i * 27 + 28; //spacing + y value

                            //text string
                            svg += '<text id="' + circles[i] + '-text" x="118" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                        };

                        //close svg string
                        svg += "</svg>";
                    }
                } else if (dataSelected[0] === "unidentified-persons"){
                    if (dataSelected[1] === "state-scale") {
                        dataStats = {min:10, max:2700, mean:1000}; //manually created values for the total combined numbers

                        $(container).append('<h3 id="legend-title" ><b><span id="unidentified-record">Unidentified</span> Persons</b></h3>');
                        $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                        //Start attribute legend svg string
                        var svg = '<svg id="attribute-legend" width="270px" height="150px">';

                        //array of circle names to base loop on
                        var circles = ["max", "mean", "min"];

                        //Loop to add each circle and text to svg string
                        for (var i=0; i<circles.length; i++){
                            //Assign the r and cy attributes
                            var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                            var cy = (180 - radius) -40;

                            //circle string
                            svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#F2B872" fill-opacity="1" stroke="#000000" cx="88"/>';

                            //evenly space out labels
                            var textY = i * 50 + 32; //spacing + y value

                            //text string
                            svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                        };

                        //close svg string
                        svg += "</svg>";
                    } else if (dataSelected[1] === "county-scale"){
                        dataStats = {min:5, max:800, mean:300}; //manually created values for the total combined numbers

                        $(container).append('<h3 id="legend-title" ><b><span id="unidentified-record">Unidentified</span> Persons</b></h3>');
                        $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                        //Start attribute legend svg string
                        var svg = '<svg id="attribute-legend" width="270px" height="150px">';

                        //array of circle names to base loop on
                        var circles = ["max", "mean", "min"];

                        //Loop to add each circle and text to svg string
                        for (var i=0; i<circles.length; i++){
                            //Assign the r and cy attributes
                            var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                            var cy = (180 - radius) -40;

                            //circle string
                            svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#F2B872" fill-opacity="1" stroke="#000000" cx="88"/>';

                            //evenly space out labels
                            var textY = i * 50 + 32; //spacing + y value

                            //text string
                            svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                        };

                        //close svg string
                        svg += "</svg>";
                    } else if (dataSelected[1] === "city-scale"){
                        dataStats = {min:5, max:500, mean:100}; //manually created values for the total combined numbers

                        $(container).append('<h3 id="legend-title" ><b><span id="unidentified-record">Unidentified</span> Persons</b></h3>');
                        $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                        //Start attribute legend svg string
                        var svg = '<svg id="attribute-legend" width="270px" height="150px">';

                        //array of circle names to base loop on
                        var circles = ["max", "mean", "min"];

                        //Loop to add each circle and text to svg string
                        for (var i=0; i<circles.length; i++){
                            //Assign the r and cy attributes
                            var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                            var cy = (180 - radius) -40;

                            //circle string
                            svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#F2B872" fill-opacity="1" stroke="#000000" cx="88"/>';

                            //evenly space out labels
                            var textY = i * 45 + 40; //spacing + y value

                            //text string
                            svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                        };

                        //close svg string
                        svg += "</svg>";
                    }
                } else if (dataSelected[0] === "unclaimed-persons"){
                    if (dataSelected[1] === "state-scale") {
                        dataStats = {min:10, max:3000, mean:1500}; //manually created values for the total combined numbers

                        $(container).append('<h3 id="legend-title" ><b><span id="unclaimed-record">Unclaimed</span> Persons</b></h3>');
                        $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                        //Start attribute legend svg string
                        var svg = '<svg id="attribute-legend" width="270px" height="150px">';

                        //array of circle names to base loop on
                        var circles = ["max", "mean", "min"];

                        //Loop to add each circle and text to svg string
                        for (var i=0; i<circles.length; i++){
                            //Assign the r and cy attributes
                            var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                            var cy = (180 - radius) -40;

                            //circle string
                            svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#D96A6A" fill-opacity="1" stroke="#000000" cx="88"/>';

                            //evenly space out labels
                            var textY = i * 50 + 32; //spacing + y value

                            //text string
                            svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                        };

                        //close svg string
                        svg += "</svg>";
                    } else if (dataSelected[1] === "county-scale"){
                        dataStats = {min:5, max:600, mean:100}; //manually created values for the total combined numbers

                        $(container).append('<h3 id="legend-title" ><b><span id="unclaimed-record">Unclaimed</span> Persons</b></h3>');
                        $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                        //Start attribute legend svg string
                        var svg = '<svg id="attribute-legend" width="270px" height="150px">';

                        //array of circle names to base loop on
                        var circles = ["max", "mean", "min"];

                        //Loop to add each circle and text to svg string
                        for (var i=0; i<circles.length; i++){
                            //Assign the r and cy attributes
                            var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                            var cy = (180 - radius) -40;

                            //circle string
                            svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#D96A6A" fill-opacity="1" stroke="#000000" cx="88"/>';

                            //evenly space out labels
                            var textY = i * 50 + 32; //spacing + y value

                            //text string
                            svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                        };

                        //close svg string
                        svg += "</svg>";
                    } else if (dataSelected[1] === "city-scale"){
                        dataStats = {min:5, max:600, mean:200}; //manually created values for the total combined numbers

                        $(container).append('<h3 id="legend-title" ><b><span id="unclaimed-record">Unclaimed</span> Persons</b></h3>');
                        $(container).append('<h3 id="legend-title-2" ><b>Total Records</b></h3>');

                        //Start attribute legend svg string
                        var svg = '<svg id="attribute-legend" width="270px" height="150px">';

                        //array of circle names to base loop on
                        var circles = ["max", "mean", "min"];

                        //Loop to add each circle and text to svg string
                        for (var i=0; i<circles.length; i++){
                            //Assign the r and cy attributes
                            var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                            var cy = (180 - radius) -40;

                            //circle string
                            svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#D96A6A" fill-opacity="1" stroke="#000000" cx="88"/>';

                            //evenly space out labels
                            var textY = i * 50 + 32; //spacing + y value

                            //text string
                            svg += '<text id="' + circles[i] + '-text" x="180" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " persons" + '</text>';
                        };

                        //close svg string
                        svg += "</svg>";
                    }
                }
            }

            //add attribute legend svg to container
            $(container).append(svg);

            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });
    map.addControl(new LegendControl());
};


/////  Filter Functions  /////
// Retrieve which database is selected and update advance filter labels and map
function getDatabase(){
    dataSelected[0] = document.querySelector('.database-check:checked').value;
    var container = L.DomUtil.get('map');

    if (dataSelected[0] === "missing-persons") {
        $('.data-header').html("Data: <span style=\"color:#66A3D9;\">Missing </span><img id='#dropdown' src='img/noun_Dropdown.svg' width='25' height='25'>");
        $('#date-gone-found').html("Date Last Seen");
        $('#adv-filt').attr('data-toggle', "collapse");
        $("#special-genders").hide();
        $("#age-selection").show();
        dataFiltered = false;
        resetFilterOptions();

    } else if (dataSelected[0] === "unidentified-persons") {
        dataFiltered = false;
        resetFilterOptions();
        $('.data-header').html("Data: <span style=\"color:#F2B872;\">Unidentified </span><img id='#dropdown' src='img/noun_Dropdown.svg' width='25' height='25'>");
        $('#date-gone-found').html("Date Body Found");
        $('#adv-filt').attr('data-toggle', "collapse");
        $("#special-genders").show();
        $("#age-selection").show();

    } else if (dataSelected[0] === "unclaimed-persons") {
        dataFiltered = false;
        resetFilterOptions();
        $('.data-header').html("Data: <span style=\"color:#D96A6A;\">Unclaimed </span><img id='#dropdown' src='img/noun_Dropdown.svg' width='25' height='25'>");
        $('#date-gone-found').html("Date Body Found");
        $('#adv-filt').attr('data-toggle', "collapse");
        $("#special-genders").hide();
        $("#age-selection").hide();

    } else if (dataSelected[0] === "combined-database") {
        dataFiltered = false;
        resetFilterOptions();
        $('.data-header').html("Data: <span style=\"color:#78BFA5;\">Combined </span><img id='#dropdown' src='img/noun_Dropdown.svg' width='25' height='25'>");
        // $('#collapseTwo').collapse('hide');
        $('#collapseThree').collapse('hide');
        $('#date-gone-found').html("...");
        $('#adv-filt').attr('data-toggle', "");
    }
}

// Retrieve which map scale is selected and update map
function getMapScale(){
    dataSelected[1] = document.querySelector('.mapScale-check:checked').value;

    if (dataSelected[1] === "state-scale") {
        $('.mapScale-header').html("Map Scale: State <img id='#dropdown' src='img/noun_Dropdown.svg' width='25' height='25'>");
        dataFiltered = false;

        resetMap();
    } else if (dataSelected[1]=== "county-scale") {
        $('.mapScale-header').html("Map Scale: County <img id='#dropdown' src='img/noun_Dropdown.svg' width='25' height='25'>");
        dataFiltered = false;

        resetMap();
    } else if (dataSelected[1] === "city-scale") {
        $('.mapScale-header').html("Map Scale: City <img id='#dropdown' src='img/noun_Dropdown.svg' width='25' height='25'>");
        dataFiltered = false;

        resetMap();
    }
}

// Function to Select All/Deselect All Ethnicity Boxes
function checkAllEthnicity(){
    // Check or Uncheck All checkboxes
    $("#ethnicity-all").change(function(){
        var checked = $(this).is(':checked');
        if(checked){
          $(".ethnicity-check").each(function(){
            $(this).prop("checked",true);
          });
        }else{
          $(".ethnicity-check").each(function(){
            $(this).prop("checked",false);
          });
        }
      });

     // Changing state of CheckAll checkbox
     $(".ethnicity-check").click(function(){

       if($(".ethnicity-check").length == $(".ethnicity-check:checked").length) {
         $("#ethnicity-all").prop("checked", true);
       } else {
         $("#ethnicity-all").removeAttr("checked");
       }

     });
}

// Function to Select All/Deselect All Month Boxes
function checkAllMonths(){
    // Check or Uncheck All checkboxes
    $("#month-all").change(function(){
        var checked = $(this).is(':checked');
        if(checked){
          $(".month-check").each(function(){
            $(this).prop("checked",true);
          });
        }else{
          $(".month-check").each(function(){
            $(this).prop("checked",false);
          });
        }
      });

     // Changing state of CheckAll checkbox
     $(".month-check").click(function(){

       if($(".month-check").length == $(".month-check:checked").length) {
         $("#month-all").prop("checked", true);
       } else {
         $("#month-all").removeAttr("checked");
       }

     });
}

// Get the gender that was checked
function getCheckedGender() {
    var genderSelected = document.querySelector('.gender-check:checked').value; //$('.gender-check:checked').val())
    if (genderSelected === "All") {
        var output = ["Female", "Male", "Other", "Unsure"]
    } else if (genderSelected === "Female") {
        var output = ["Female"]
    } else if (genderSelected === "Male") {
        var output = ["Male"]
    } else if (genderSelected === "Other") {
        var output = ["Other"]
    } else if (genderSelected === "Unsure") {
        var output = ["Unsure"]
    }
    return output;
}

// Get the list of ethnicity checkboxes checked
function getCheckedEthnicity() {
    var checkboxes = document.getElementsByName('ethnicity-check');
    var checkboxesChecked = [];
    // loop over them all
    for (var i=0; i<checkboxes.length; i++) {
       // And stick the checked ones onto an array...
       if (checkboxes[i].checked) {
          checkboxesChecked.push(checkboxes[i].value);
       }
    }
    // Return the array if it is non-empty, or default to all
    return checkboxesChecked.length > 0 ? checkboxesChecked : ["American Indian / Alaska Native", "Asian", "Black / African American", "Hawaiian / Pacific Islander", "Hispanic / Latino", "White / Caucasian", "Other", "Uncertain"];
}

// Get the list of month checkboxes checked
function getCheckedMonth() {
    var checkboxes = document.getElementsByName('month-check');
    var checkboxesChecked = [];
    // loop over them all
    for (var i=0; i<checkboxes.length; i++) {
       // And stick the checked ones onto an array...
       if (checkboxes[i].checked) {
          checkboxesChecked.push(Number(checkboxes[i].value));
       }
    }
    // Return the array if it is non-empty, or default to all
    return checkboxesChecked.length > 0 ? checkboxesChecked : [1,2,3,4,5,6,7,8,9,10,11,12];
}

//Reset the Advanced Filter Options to Default
function resetFilterOptions() {
    $("#advanced-filter").trigger("reset");

    dataFiltered = false;
    gender = ["Female", "Male"];
    ageFrom = 0;
    ageTo = 120;
    ethnicity = ["American Indian / Alaska Native", "Asian", "Black / African American", "Hawaiian / Pacific Islander", "Hispanic / Latino", "White / Caucasian", "Other", "Uncertain"];
    yearStart = 1900;
    yearEnd = 2020;
    Month = [1,2,3,4,5,6,7,8,9,10,11,12]

    resetMap();
}

//Clear the map and recreate it
function resetMap(){
    $("#loadingScreen").css("display", "block");
    $("#spinner").css("display", "block");

    // Remove the Pop symbol layer and the legend
    map.removeLayer(mapSymbols);
    map.removeLayer(mapFeatures);
    $(".secondary").css("display", "none");
    $(".legend-control-container").remove();

    // Get data differently depending on if it is filtered or not
    if (dataFiltered){
        getDataFiltered(map);
    } else {
        getData(map);
    }

    setTimeout(function() { // allow spinner to load before work starts
        $("#spinner").css("display", "none");
        $("#loadingScreen").css("display", "none");
    },1500);


}

// Retrieve which advanced filter options are selected
function getFilterOptions(){
    //Check to make sure ageFrom is not older than ageTo and yearStart is not later than yearEnd
    //If it passes those checks, than accept the form
    if (Number($('#ageFrom-check').val()) > Number($('#ageTo-check').val())){
        alert("Submission not accepted. Age From is later than Age To.");
    } else if (Number($('#yearStart-check').val()) > Number($('#yearEnd-check').val())) {
        alert("Submission not accepted. Year Start is later than Year End.");
    } else {
        dataFiltered = true;
        gender = getCheckedGender();
        ageFrom = Number(document.querySelector('#ageFrom-check').value); //$('#ageFrom-check').val())
        ageTo = Number(document.querySelector('#ageTo-check').value);
        ethnicity = getCheckedEthnicity();
        yearStart = Number(document.querySelector('#yearStart-check').value);
        yearEnd = Number(document.querySelector('#yearEnd-check').value);
        month = getCheckedMonth();

        doAdvanceFilter();
    }
}

// Function to filter the data per the selected options
function doAdvanceFilter() {
    // shortand for the filtering below
    data = currentDB.features;

    // Make sure filter is empty before applying new filter
    for (eachArea in currentDB.features){
        currentDB.features[eachArea].properties.filtered = [];
    }

    //Loop through all of the records comparing the filtered options to the record
    if (dataSelected[0]=== "missing-persons") {
        //Loop through each enumeration area
        for (eachArea in data){
            //Loop through each record
            for (eachRecord in data[eachArea].properties.missing){
                var currentVar = data[eachArea].properties.missing[eachRecord];

                //Compare gender first
                for (eachGender in gender){
                    if(currentVar["Sex"] === gender[eachGender]){
                        //Compare age
                        if(Number(currentVar["Missing Age"]) >= Number(ageFrom) && Number(currentVar["Missing Age"]) <= Number(ageTo)){
                            //Compare Year
                            if(currentVar["DLC"].slice(-4) >= yearStart && currentVar["DLC"].slice(-4) <= yearEnd){
                                //Compare Month
                                for (eachMonth in month){
                                    if(currentVar["DLC"].substr(0, currentVar["DLC"].indexOf('/')) == month[eachMonth]){
                                        //Compare ethnicity
                                        for(eachEthnicity in ethnicity) {
                                            if(currentVar["Race / Ethnicity"].includes(ethnicity[eachEthnicity])){

                                                //Only add records to new filtered list if it has not been added already, accounts for data issues in ethnicity
                                                //First add the first record to the filtered so there a value to compare to if the records is already added
                                                if(data[eachArea].properties.filtered.length < 1){
                                                    currentDB.features[eachArea].properties.filtered.push(currentVar);

                                                } else {
                                                    // Then if the case is not already in the array, add it
                                                    if (!(currentVar["Case Number"] in data[eachArea].properties.filtered)){
                                                        currentDB.features[eachArea].properties.filtered.push(currentVar);
                                                    }
                                                }
                                                // Break to stop comparing when record person has multiple ethnicities
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } else if (dataSelected[0] === "unclaimed-persons") {
        //Loop through each enumeration area
        for (eachArea in data){
            //Loop through each record
            for (eachRecord in data[eachArea].properties.unclaimed){
                var currentVar = data[eachArea].properties.unclaimed[eachRecord];

                //Compare gender first
                for (eachGender in gender){
                    if(currentVar["Sex"] === gender[eachGender]){
                        //Compare Year
                        if(currentVar["DBF"].slice(-4) >= yearStart && currentVar["DBF"].slice(-4) <= yearEnd){
                            //Compare Month
                            for (eachMonth in month){
                                if(currentVar["DBF"].substr(0, currentVar["DBF"].indexOf('/')) == month[eachMonth]){
                                    //Compare ethnicity
                                    for(eachEthnicity in ethnicity) {
                                        if(currentVar["Race / Ethnicity"].includes(ethnicity[eachEthnicity])){

                                            //Only add records to new filtered list if it has not been added already, accounts for data issues in ethnicity
                                            //First add the first record to the filtered so there a value to compare to if the records is already added
                                            if(data[eachArea].properties.filtered.length < 1){
                                                currentDB.features[eachArea].properties.filtered.push(currentVar);

                                            } else {
                                                // Then if the case is not already in the array, add it
                                                if (!(currentVar["Case Number"] in data[eachArea].properties.filtered)){
                                                    currentDB.features[eachArea].properties.filtered.push(currentVar);
                                                }
                                            }
                                            // Break to stop comparing when record person has multiple ethnicities
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } else if (dataSelected[0] === "unidentified-persons") {
        //Loop through each enumeration area
        for (eachArea in data){
            //Loop through each record
            for (eachRecord in data[eachArea].properties.unidentified){
                var currentVar = data[eachArea].properties.unidentified[eachRecord];

                //Compare gender first
                for (eachGender in gender){
                    if(currentVar["Sex"] === gender[eachGender]){
                        //Compare age
                        if(Number(currentVar["Age To"]) >= Number(ageFrom) && Number(currentVar["Age From"]) <= Number(ageTo)){
                            //Compare Year
                            if(currentVar["DBF"].slice(-4) >= yearStart && currentVar["DBF"].slice(-4) <= yearEnd){
                                //Compare Month
                                for (eachMonth in month){
                                    if(currentVar["DBF"].substr(0, currentVar["DBF"].indexOf('/')) == month[eachMonth]){
                                        //Compare ethnicity
                                        for(eachEthnicity in ethnicity) {
                                            if(currentVar["Race / Ethnicity"].includes(ethnicity[eachEthnicity])){

                                                //Only add records to new filtered list if it has not been added already, accounts for data issues in ethnicity
                                                //First add the first record to the filtered so there a value to compare to if the records is already added
                                                if(data[eachArea].properties.filtered.length < 1){
                                                    currentDB.features[eachArea].properties.filtered.push(currentVar);

                                                } else {
                                                    // Then if the case is not already in the array, add it
                                                    if (!(currentVar["Case Number"] in data[eachArea].properties.filtered)){
                                                        currentDB.features[eachArea].properties.filtered.push(currentVar);
                                                    }
                                                }
                                                // Break to stop comparing when record person has multiple ethnicities
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    resetMap();
}

// Function to retrieve names from currentDB and print out the selected records of that prop symbol
function getRecords(){
    $(".secondary").css("display", "block");

    var recordsHTML = '<div class="recordGrid">'

    if (dataSelected[1] === "state-scale"){
        if(dataSelected[0] === "missing-persons" && dataFiltered == false){
            // shortand for the filtering below
            data = currentDB.features;

            recordsHTML += '<h2 class="recordGrid-Title"><span id="missing-record">Missing</span> Persons Records</h2>';

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Case Number</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (data[eachArea].name === unitSelected){
                        // console.log(data[eachArea].properties.missing[eachRecord]);
                        recordsHTML += formatCaseNum(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close caseNum-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">DLC</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatDateLostFound(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close dateMissing-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Last Name</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatLastName(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close lastName-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">First Name</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatFirstName(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close firstName-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Missing Age</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatAge(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close missingAge-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Sex</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatSex(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close sex-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Ethnicity</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatEthnicity(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close ethnicty-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">City</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatCity(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close city-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">County</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatCounty(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close county-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">State</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatState(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close state-Col

            recordsHTML +='</div>'; //Close recordGrid
            $('#names-list').html(recordsHTML);
        } else if (dataSelected[0] === "unclaimed-persons" && dataFiltered == false){
            // shortand for the filtering below
            data = currentDB.features;

            recordsHTML += '<h2 class="recordGrid-Title"><span id="unclaimed-record">Unclaimed</span> Persons Records</h2>';

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Case Number</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (data[eachArea].name === unitSelected){
                        // console.log(data[eachArea].properties.unclaimed[eachRecord]);
                        recordsHTML += formatCaseNum(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close caseNum-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">DBF</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatDateLostFound(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close datebody-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Last Name</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatLastName(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close lastName-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">First Name</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatFirstName(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close firstName-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Sex</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatSex(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close sex-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Ethnicity</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatEthnicity(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close ethnicty-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">City</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatCity(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close city-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">County</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatCounty(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close county-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">State</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatState(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close state-Col

            recordsHTML +='</div>'; //Close recordGrid
            $('#names-list').html(recordsHTML);
        } else if (dataSelected[0] === "unidentified-persons" && dataFiltered == false){
            // shortand for the filtering below
            data = currentDB.features;

            recordsHTML += '<h2 class="recordGrid-Title"><span id="unidentified-record">Unidentified</span> Persons Records</h2>';

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Case Number</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (data[eachArea].name === unitSelected){
                        // console.log(data[eachArea].properties.unidentified[eachRecord]);
                        recordsHTML += formatCaseNum(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close caseNum-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">DBF</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatDateLostFound(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close datebody-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Age From</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatAgeFrom(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close agefrom-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">First Name</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatAgeTo(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close ageto-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Sex</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatSex(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close sex-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Ethnicity</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatEthnicity(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close ethnicty-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">City</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatCity(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close city-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">County</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatCounty(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close county-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">State</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (data[eachArea].name === unitSelected){
                        recordsHTML += formatState(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close state-Col

            recordsHTML +='</div>'; //Close recordGrid
            $('#names-list').html(recordsHTML);
        } else { //Filtered records
            if(dataSelected[0] === "missing-persons"){
                // shortand for the filtering below
                data = currentDB.features;

                recordsHTML += '<h2 class="recordGrid-Title"><span id="missing-record">Missing</span> Persons Records</h2>';

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Case Number</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            // console.log(data[eachArea].properties.filtered[eachRecord]);
                            recordsHTML += formatCaseNum(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close caseNum-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">DLC</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatDateLostFound(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close dateMissing-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Last Name</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatLastName(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close lastName-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">First Name</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatFirstName(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close firstName-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Missing Age</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatAge(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close missingAge-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Sex</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatSex(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close sex-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Ethnicity</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatEthnicity(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close ethnicty-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">City</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatCity(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close city-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">County</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatCounty(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close county-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">State</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatState(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close state-Col

                recordsHTML +='</div>'; //Close recordGrid
                $('#names-list').html(recordsHTML);
            } else if (dataSelected[0] === "unclaimed-persons"){
                // shortand for the filtering below
                data = currentDB.features;

                recordsHTML += '<h2 class="recordGrid-Title"><span id="unclaimed-record">Unclaimed</span> Persons Records</h2>';

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Case Number</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            // console.log(data[eachArea].properties.filtered[eachRecord]);
                            recordsHTML += formatCaseNum(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close caseNum-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">DBF</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatDateLostFound(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close datebody-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Last Name</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatLastName(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close lastName-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">First Name</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatFirstName(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close firstName-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Sex</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatSex(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close sex-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Ethnicity</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatEthnicity(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close ethnicty-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">City</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatCity(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close city-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">County</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatCounty(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close county-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">State</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatState(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close state-Col

                recordsHTML +='</div>'; //Close recordGrid
                $('#names-list').html(recordsHTML);
            } else if (dataSelected[0] === "unidentified-persons"){
                // shortand for the filtering below
                data = currentDB.features;

                recordsHTML += '<h2 class="recordGrid-Title"><span id="unidentified-record">Unidentified</span> Persons Records</h2>';

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Case Number</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            // console.log(data[eachArea].properties.filtered[eachRecord]);
                            recordsHTML += formatCaseNum(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close caseNum-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">DBF</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatDateLostFound(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close datebody-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Age From</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatAgeFrom(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close agefrom-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">First Name</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatAgeTo(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close ageto-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Sex</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatSex(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close sex-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Ethnicity</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatEthnicity(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close ethnicty-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">City</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatCity(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close city-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">County</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatCounty(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close county-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">State</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (data[eachArea].name === unitSelected){
                            recordsHTML += formatState(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close state-Col

                recordsHTML +='</div>'; //Close recordGrid
                $('#names-list').html(recordsHTML);
            }
        }
    } else if (dataSelected[1] === "county-scale") {
        if(dataSelected[0] === "missing-persons" && dataFiltered == false){
            // shortand for the filtering below
            data = currentDB.features;

            recordsHTML += '<h2 class="recordGrid-Title"><span id="missing-record">Missing</span> Persons Records</h2>';

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Case Number</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        // console.log(data[eachArea].properties.missing[eachRecord]);
                        recordsHTML += formatCaseNum(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close caseNum-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">DLC</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatDateLostFound(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close dateMissing-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Last Name</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatLastName(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close lastName-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">First Name</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatFirstName(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close firstName-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Missing Age</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatAge(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close missingAge-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Sex</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatSex(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close sex-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Ethnicity</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatEthnicity(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close ethnicty-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">City</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatCity(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close city-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">County</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatCounty(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close county-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">State</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.missing){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatState(data[eachArea].properties.missing[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close state-Col

            recordsHTML +='</div>'; //Close recordGrid
            $('#names-list').html(recordsHTML);
        } else if (dataSelected[0] === "unclaimed-persons" && dataFiltered == false){
            // shortand for the filtering below
            data = currentDB.features;

            recordsHTML += '<h2 class="recordGrid-Title"><span id="unclaimed-record">Unclaimed</span> Persons Records</h2>';

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Case Number</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        // console.log(data[eachArea].properties.unclaimed[eachRecord]);
                        recordsHTML += formatCaseNum(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close caseNum-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">DBF</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatDateLostFound(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close datebody-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Last Name</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatLastName(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close lastName-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">First Name</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatFirstName(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close firstName-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Sex</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatSex(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close sex-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Ethnicity</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatEthnicity(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close ethnicty-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">City</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatCity(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close city-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">County</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatCounty(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close county-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">State</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unclaimed){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatState(data[eachArea].properties.unclaimed[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close state-Col

            recordsHTML +='</div>'; //Close recordGrid
            $('#names-list').html(recordsHTML);
        } else if (dataSelected[0] === "unidentified-persons" && dataFiltered == false){
            // shortand for the filtering below
            data = currentDB.features;

            recordsHTML += '<h2 class="recordGrid-Title"><span id="unidentified-record">Unidentified</span> Persons Records</h2>';

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Case Number</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        // console.log(data[eachArea].properties.unidentified[eachRecord]);
                        recordsHTML += formatCaseNum(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close caseNum-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">DBF</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatDateLostFound(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close datebody-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Age From</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatAgeFrom(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close agefrom-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">First Name</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatAgeTo(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close ageto-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Sex</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatSex(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close sex-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Ethnicity</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatEthnicity(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close ethnicty-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">City</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatCity(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close city-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">County</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatCounty(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close county-Col

            recordsHTML += '<div class="record-col">' + '<h6 class="col-title">State</h6>';
            //Loop through each enumeration area
            for (eachArea in data){
                //Loop through each record
                for (eachRecord in data[eachArea].properties.unidentified){
                    if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                        recordsHTML += formatState(data[eachArea].properties.unidentified[eachRecord])
                    }
                }
            }
            recordsHTML += '</div>'; //Close state-Col

            recordsHTML +='</div>'; //Close recordGrid
            $('#names-list').html(recordsHTML);
        } else { //Filtered records
            if(dataSelected[0] === "missing-persons"){
                // shortand for the filtering below
                data = currentDB.features;

                recordsHTML += '<h2 class="recordGrid-Title"><span id="missing-record">Missing</span> Persons Records</h2>';

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Case Number</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            // console.log(data[eachArea].properties.filtered[eachRecord]);
                            recordsHTML += formatCaseNum(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close caseNum-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">DLC</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatDateLostFound(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close dateMissing-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Last Name</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatLastName(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close lastName-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">First Name</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatFirstName(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close firstName-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Missing Age</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatAge(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close missingAge-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Sex</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatSex(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close sex-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Ethnicity</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatEthnicity(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close ethnicty-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">City</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatCity(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close city-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">County</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatCounty(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close county-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">State</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatState(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close state-Col

                recordsHTML +='</div>'; //Close recordGrid
                $('#names-list').html(recordsHTML);
            } else if (dataSelected[0] === "unclaimed-persons"){
                // shortand for the filtering below
                data = currentDB.features;

                recordsHTML += '<h2 class="recordGrid-Title"><span id="unclaimed-record">Unclaimed</span> Persons Records</h2>';

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Case Number</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            // console.log(data[eachArea].properties.filtered[eachRecord]);
                            recordsHTML += formatCaseNum(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close caseNum-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">DBF</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatDateLostFound(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close datebody-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Last Name</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatLastName(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close lastName-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">First Name</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatFirstName(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close firstName-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Sex</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatSex(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close sex-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Ethnicity</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatEthnicity(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close ethnicty-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">City</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatCity(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close city-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">County</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatCounty(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close county-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">State</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatState(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close state-Col

                recordsHTML +='</div>'; //Close recordGrid
                $('#names-list').html(recordsHTML);
            } else if (dataSelected[0] === "unidentified-persons"){
                // shortand for the filtering below
                data = currentDB.features;

                recordsHTML += '<h2 class="recordGrid-Title"><span id="unidentified-record">Unidentified</span> Persons Records</h2>';

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Case Number</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            // console.log(data[eachArea].properties.filtered[eachRecord]);
                            recordsHTML += formatCaseNum(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close caseNum-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">DBF</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatDateLostFound(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close datebody-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Age From</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatAgeFrom(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close agefrom-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">First Name</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatAgeTo(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close ageto-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Sex</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatSex(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close sex-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">Ethnicity</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatEthnicity(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close ethnicty-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">City</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatCity(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close city-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">County</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatCounty(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close county-Col

                recordsHTML += '<div class="record-col">' + '<h6 class="col-title">State</h6>';
                //Loop through each enumeration area
                for (eachArea in data){
                    //Loop through each record
                    for (eachRecord in data[eachArea].properties.filtered){
                        if (Number(data[eachArea]["county_FIPS"]) === Number(unitSelected)){
                            recordsHTML += formatState(data[eachArea].properties.filtered[eachRecord])
                        }
                    }
                }
                recordsHTML += '</div>'; //Close state-Col

                recordsHTML +='</div>'; //Close recordGrid
                $('#names-list').html(recordsHTML);
            }
        }
    } else if (dataSelected[1] === "city-scale"){
        //Not printable
    }
}

// Retrieve the case number and return it
function formatCaseNum(data){
    var caseNumber = data["Case Number"];

    if (dataSelected[0] === "missing-persons") {
        var caseLink = namusLink("MissingPersons", caseNumber, "MP");

    } else if (dataSelected[0] === "unclaimed-persons") {
        var caseLink = namusLink("UnclaimedPersons", caseNumber, "UCP");

    } else if (dataSelected[0] === "unidentified-persons") {
        var caseLink = namusLink("UnidentifiedPersons", caseNumber, "UP");

    }
    return '<p>' + caseLink + '</p>';
}

// Retrieve the date the person was last seen or date the body was found
function formatDateLostFound(data) {
    if (dataSelected[0] === "missing-persons") {
        var date = data["DLC"];

    } else if (dataSelected[0] === "unclaimed-persons") {
        var date = data["DBF"];

    } else if (dataSelected[0] === "unidentified-persons") {
        var date = data["DBF"];

    }
    return '<p>' + date + '</p>';
}

// Retrieve the first name of person
function formatFirstName(data){
    var firstName = data["First Name"];

    return '<p>' + firstName + '</p>';

}

// Retrieve the last name of person
function formatLastName(data){
    var lastName = data["Last Name"];

    return '<p>' + lastName + '</p>';
}

// Retrieve the missing age of person
function formatAge(data){
    var age = data["Missing Age"];

    return '<p>' + age + '</p>';
}

// Retrieve the starting age range
function formatAgeFrom(data){
    var age = data["Age From"];

    return '<p>' + Math.round(age) + '</p>';
}

// Retrieve the end age range
function formatAgeTo(data){
    var age = data["Age To"];

    return '<p>' + Math.round(age) + '</p>';
}

// Retrieve the sex of the person
function formatSex(data){
    var sex = data["Sex"];

    return '<p>' + sex + '</p>';
}

// Retrieve the ethnicity
function formatEthnicity(data){
    var race = data["Race / Ethnicity"];

    return '<p>' + race + '</p>';
}

// Retrieve the city
function formatCity(data){
    var city = data["City"];
    if (city === "nan"){
        city = "-";
    }

    return '<p>' + city + '</p>';
}

// Retrieve the county
function formatCounty(data){
    var county = data["County"];
    if (county === "nan"){
        county = "-";
    }

    return '<p>' + county + '</p>';
}

// Retrieve the state
function formatState(data){
    var state = data["State"];

    return '<p>' + state + '</p>';
}

//Add a link to Case Number to the Namus website
function namusLink(caseType, caseNumber, caseNumberPrefix) {
    var url = 'https://www.namus.gov/' + caseType + '/Case#/' + caseNumber.replace(caseNumberPrefix, '');

    var link = '<a href="' + url + '" target="_blank">' + caseNumber + '</a>';

    return link;
}


/////  Event Listeners  /////

// Database
document.querySelectorAll(".database-check").forEach( input => input.addEventListener('click', getDatabase) );
//Map Scale
document.querySelectorAll(".mapScale-check").forEach( input => input.addEventListener('click', getMapScale) );
// Reset Button
document.querySelectorAll(".reset-btn").forEach( input => input.addEventListener('click', resetFilterOptions) );
// Submit Button
document.querySelectorAll(".submit-btn").forEach( input => input.addEventListener('click', getFilterOptions) );
//Select All Ethnicity Button
$(document).ready(checkAllEthnicity);
//Select All Months Button
$(document).ready(checkAllMonths);

//Retrieve names from within popup
$("body").on('click','a.retrieveNames', function(e){
    e.preventDefault();
    getRecords();
    // document.getElementById("names-list").scrollTop() -= 100;

    const yOffset = -400;
    const element = document.getElementById("names-list");
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

    window.scrollTo({top: y, behavior: 'smooth'});
});

// Open popup warning to view on desktop if user opens in mobile
// Otherwise Splash Screen when start
$(window).on("resize load", function () {
    if ($( window ).width() <= 600) {
        $('#mobile-screen').modal('show');
        $('#splash-screen').modal('hide');
    } else if ($( window ).width() > 600){
        $('#mobile-screen').modal('hide');
        $('#splash-screen').modal('show');
    }
});

//Create Map
$(document).ready(createMap());
