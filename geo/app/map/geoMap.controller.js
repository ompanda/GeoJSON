(function () {
    'use strict';

    angular
        .module('app')
        .controller('geoMapController', geoMapController);

    geoMapController.$inject = ['$scope', 'geoMapService'];

    function geoMapController($scope, geoMapService) {
        var geoJSONPath = "mock-data/us_states_geojson.json";//"http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"; //

        $scope.mapData = null;

        init();

        function init() {
            geoMapService.getData(geoJSONPath)
            .success(function (data) {
                $scope.mapData = data;
                console.log(data);
            })
            .error(function (error) {
                console.log(error);
            });
        }
    }
})();
