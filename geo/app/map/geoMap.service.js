(function () {
    'use strict';

    angular
        .module('app')
        .service('geoMapService', geoMapService);

    geoMapService.$inject = ['$http'];

    function geoMapService($http) {
        this.getData = getData;

        function getData(path) {
            return $http.get(path);
        }
    }
})();