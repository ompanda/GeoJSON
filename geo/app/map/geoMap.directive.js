(function () {
    'use strict';

    angular
        .module('app')
        .directive('geoMap', geoMapDirective);

    geoMapDirective.$inject = ['$window'];

    function geoMapDirective($window) {
        var directive = {
            restrict: 'E',
            template: '<div id="gmaps"></div>',
            replace: true,
            scope: {
                geoMapData: '@'
            },
            link: link
        };
        return directive;

        function link(scope, element, attrs) {
            // show the map and place some markers
            initMap(element, scope);
        }

        // init the map
        function initMap(element, scope) {
            var map, infoWindow;
            var markers = [];

            // map config
            var mapOptions = {
                zoom: 4,
                center: { lat: 33.045579573575154, lng: -96.97189523828126 },
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                scrollwheel: true,
                // styles: [{ "stylers": [{ "saturation": -75 }, { "lightness": 75 }] }]
            };

            if (map === void 0) {
                map = new google.maps.Map(element[0], mapOptions);
            }



            scope.$watch('geoMapData', function (value) {
                if (value) {
                    //map.data.addGeoJson(JSON.parse(value));
                    var data = JSON.parse(value);

                    // add d3 over lay
                    var overlay = new google.maps.OverlayView();

                    overlay.onAdd = function () {
                        var layer = d3.select(this.getPanes().overlayMouseTarget).append("div").attr("class", "SvgOverlay");
                        var svg = layer.append("svg");
                        var quakes = svg.append("g").attr("class", "Quakes");

                        overlay.draw = function () {
                            var markerOverlay = this;
                            var overlayProjection = markerOverlay.getProjection();

                            // Turn the overlay projection into a d3 projection
                            var googleMapProjection = function (coordinates) {
                                var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
                                var pixelCoordinates = overlayProjection.fromLatLngToDivPixel(googleCoordinates);
                                return [pixelCoordinates.x + 4000, pixelCoordinates.y + 4000];
                            }

                            var path = d3.geo.path().projection(googleMapProjection);

                            quakes.selectAll("path")
                            .data(data.features)
                            .attr("d", path.pointRadius(function (d) {
                                return !isNaN(parseFloat(d.properties.mag)) ? Math.sqrt((Math.exp(parseFloat(d.properties.mag)))) : 1;
                            }))
                            .attr("class", "myPathClass")
                            .enter().append("svg:path")
                            .attr("d", path.pointRadius(function (d) {
                                return !isNaN(parseFloat(d.properties.mag)) ? Math.sqrt((Math.exp(parseFloat(d.properties.mag)))) : 1;
                            }))
                            .on("click", function (d) {
                                //var mousePosition = d3.svg.mouse(this);
                                var format = d3.time.format("%Y-%m-%d %HH:%MM:%SS");
                                $("#detail-pop-up").fadeOut(100, function () {
                                    // Popup content
                                    $("#detail-pop-up-title").html(d.properties.NAME);
                                    $("#detail-pop-img").html(d.properties.GEO_ID);
                                    $("#detail-pop-desc").html(d.properties.CENSUSAREA);

                                    $("#detail-pop-up").css({
                                        "right": 0,
                                        "top": 50
                                    });
                                    $("#detail-pop-up").fadeIn(100);
                                });
                            }).
                            on("mouseout", function () {
                                //$("#detail-pop-up").fadeOut(50);
                            });
                        };

                        createHistogram(data, quakes);
                    };

                    overlay.setMap(map);
                }
            });
        }

        function createHistogram(dataset, svgclass) {
            var formatCount = d3.format(",.0f");
            var values = dataset.features.map(function (d) { return d.properties.CENSUSAREA; });

            var margin = { top: 10, right: 30, bottom: 40, left: 30 },
            width = 500 - margin.left - margin.right,
            height = 200 - margin.top - margin.bottom;

            var x = d3.scale.linear()
            .domain([0, 100000])
            .range([0, width]);
                    //.domain([0, d3.max(dataset, function (d) { return d.x + 10; })])
                    //.range([0, width]);  // Set margins for x specific

         

            // Generate a histogram using twenty uniformly-spaced bins.
            var data = d3.layout.histogram()
                .bins(x.ticks(10))
                (values);

            var y = d3.scale.linear()
                .domain([0, d3.max(data, function (d) { return d.y; })])
                .range([height, 0]);


            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")

            var svgbar = d3.select("body").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("class", "hist")
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            svgbar.append("text")
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .attr("y", 5)
                .attr("x", 300)
                .attr("text-anchor", "middle")
                .text("");

            var bar = svgbar.selectAll(".bar")
                .data(data)
                .enter().append("g")
                .attr("class", "bar")
                .attr("transform", function (d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; })
                .on("mouseover", function (d, i) {
                    d3.selectAll(".SvgOverlay path").filter(function (e) {
                        return d3.min(d) <= e.properties.CENSUSAREA && e.properties.CENSUSAREA < d3.max(d)
                    }).style({ 'fill': 'red', 'stroke': 'yellow' })
                })
                .on("mouseout", function (d, i) {
                    d3.selectAll(".SvgOverlay path").filter(function (e) {
                        return d3.min(d) <= e.properties.CENSUSAREA && e.properties.CENSUSAREA < d3.max(d)
                    }).style({ 'fill': '', 'stroke': '' });
                });

            bar.append("rect")
                .attr("x", 1)
                .attr("width", x(data[0].dx) - 1)
                .attr("height", function (d) { return height - y(d.y); });

            bar.append("text")
                .attr("dy", ".75em")
                .attr("y", -10)
                .attr("x", x(data[0].dx) / 2)
                .attr("text-anchor", "middle")
                .text(function (d) { return d.y; });
            //.text(function (d) { return formatCount(d.y); });

            svgbar.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .append("text")
                    .attr("font-size", "12px")
                    .attr("y", 30)
                    .attr("x", 200)
                    .attr("text-anchor", "middle")
                    .text("CENSUS AREA");;

            return svgbar;
        }

        // place a marker
        function setMarker(map, position, title, content) {
            var marker;
            var markerOptions = {
                position: position,
                map: map,
                title: title,
                icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
            };

            marker = new google.maps.Marker(markerOptions);
            markers.push(marker); // add marker to array

            google.maps.event.addListener(marker, 'click', function () {
                // close window if not undefined
                if (infoWindow !== void 0) {
                    infoWindow.close();
                }
                // create new window
                var infoWindowOptions = {
                    content: content
                };
                infoWindow = new google.maps.InfoWindow(infoWindowOptions);
                infoWindow.open(map, marker);
            });
        }
    }

})();