(function() {
  'use strict';

  angular
    .module('weatherApp', [
      'ngAnimate',
      'ngCookies',
      'restangular',
      'ui.router',
      'ui.bootstrap',
      'toastr',
      'ngMap'
  ]);

})();

(function() {
  'use strict';

  angular
    .module('weatherApp')
    .directive('weather', weatherDirective);

  /** @ngInject */
  function weatherDirective() {
    WeatherController.$inject = ["$scope"];
    var directive = {
      restrict: 'E',
      templateUrl: 'app/components/weather/weather.html',
      require: 'ngModel',
      scope: {
         model: '=ngModel'
      },
      controller: WeatherController
    };

    return directive;

    /** @ngInject */
    function WeatherController($scope) {

      $scope.getCloudness = function() {
        var val;
        switch(true) {
          case ($scope.model.clouds.all >= 0 &&
                $scope.model.clouds.all <= 30):
            val = 'shiny';
            break;
          case ($scope.model.clouds.all > 30 &&
                $scope.model.clouds.all <= 65):
            val = 'medium';
            break;
          default:
            val = 'heavy';
        }
        return val;
      };
    }
  }

})();

(function() {
  'use strict';

  angular
    .module('weatherApp')
    .directive('acmeNavbar', acmeNavbar);

  /** @ngInject */
  function acmeNavbar() {
    NavbarController.$inject = ["$scope", "$state"];
    var directive = {
      restrict: 'E',
      templateUrl: 'app/components/navbar/navbar.html',
      scope: {
        geo: '=',
      },
      controller: NavbarController,
      controllerAs: 'navbar',
      bindToController: true
    };

    return directive;

    /** @ngInject */
    function NavbarController($scope, $state) {
      var vm = this;
      vm.$state = $state;

      var geo;
      $scope.$on('coordinates', function(event, data) {
        geo = data;
      });

      vm.changeState = function() {
        $state.go('app.forecast', {
          lat: geo.latitude,
          lon: geo.longitude
        });
      };


    }
  }

})();

(function() {
  'use strict';

  angular
    .module('weatherApp')
    .service('Helpers', HelpersService);

  /** @ngInject */
  function HelpersService() {
    var service = this;

    service.addLeadZero = function(value) {
      return ("0" + value).slice(-2);
    };

    service.parseData = function(data) {
      var parsedData = {};

      if (data.list && data.list.length) {
        angular.forEach(data.list, function(value) {

          var arr = value.dt_txt.split(' ');
          var dateKey = arr[0];
          value.time = arr[1].slice(0, 5);

          if (!parsedData[dateKey]) {
            parsedData[dateKey] = [];
          }
          parsedData[dateKey].push(value);

        });
      }

      return parsedData;
    };

    return service;
  }

})();

(function() {
  'use strict';

  APIService.$inject = ["$http", "$q", "config", "toastr"];
  angular
    .module('weatherApp')
    .service('API', APIService);

  /** @ngInject */
  function APIService($http, $q, config, toastr) {
    var service = this;
    var validateArgument = function(value) {
      return !!value;
    };
    var lat = 50.4501,
        lon = 30.5234;
    var c = config;
    service.forecast = {
      url: c.PROTOCOL + c.API_URL + c.PORT + c.DIR_SEP +
           c.API_PATH + c.API_VERSION + c.DIR_SEP +
           c.FORECAST_ACTION + "?APIKEY=" + c.API_KEY,

      get: function(lat, lon) {
        var defer = $q.defer();
        if (typeof lat == 'undefined' || typeof lon == 'undefined') {
          defer.reject();
          return defer.promise;
        }
        var url = this.url + '&lat=' + lat + "&lon=" + lon;
        $http
          .get(url)
          .then(function(response) {
            defer.resolve(response.data);
          })
          .catch(function(reason) {
            toastr.error( angular.toJson(reason, true) );
          });

        return defer.promise;
      }
    };

  }

})();

angular.module('weatherApp')
  .directive('googleplace', function() {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, model) {
        var options = {
          types: []
        };
        scope.gPlace = new google.maps.places.Autocomplete(element[0], options);

        google.maps.event.addListener(scope.gPlace, 'place_changed', function() {
          scope.$apply(function() {
            model.$setViewValue(element.val());
          });
        });
      }
    };
  });
angular.module('weatherApp')
  .directive('getCoordinates', function() {
    return {
      restrict: 'A',
      scope: {
        address: '=ngModel',
        coordinates: '=getCoordinates'
      },
      controller: ["$scope", "$http", "$attrs", "$element", "$rootScope", function($scope, $http, $attrs, $element, $rootScope) {

        var stutter = false;

        var additionalLanguageUnchor = {
          url: '',
          lang: ''
        };

        function addressTranslate(event, newAdr) {
          stutter = true;
          $scope.address = newAdr;
        }

        $scope.$watch('address', function(newAddress) {

          if (newAddress && !stutter) {
            var apiKey = '&key=' + 'AIzaSyB6Fs_IoNpXI7_a3PvUQvx7E3r04QvGiMk';
            var parsedAddress = newAddress.split(' ').join('+');
            var addressUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + parsedAddress + additionalLanguageUnchor.url + apiKey;

            $http({
              method: 'GET',
              url: addressUrl
            }).then(function successCallback(response) {
              if (response && response.data && response.data.results[0]) {
                $scope.coordinates.latitude = response.data.results[0].geometry.location.lat;
                $scope.coordinates.longitude = response.data.results[0].geometry.location.lng;
                var addressTranslation = response.data.results[0].formatted_address;
                $rootScope.$broadcast('coordinates', $scope.coordinates);
              }

            });
          }

          stutter = false;

        });
      }]
    };
  });
(function() {
  'use strict';

  MainController.$inject = ["$scope"];
  angular
    .module('weatherApp')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($scope) {
    var vm = this;

    // $scope.$on('coordinates', function(event, data) {
    //   console.log(vm.geo);
    // });

  }
})();
(function () {
	'use strict';
	angular.module('weatherApp')
	.controller('ForecastController', ["$scope", "API", "Helpers", "$stateParams", function ($scope, API, Helpers, $stateParams) {
		var vm = this;

		// console.time('API call');
		API.forecast
			.get($stateParams.lat, $stateParams.lon)
			.then(function (data) {
				vm.city = data.city;
				// console.timeEnd('API call');
				vm.data = Helpers.parseData(data);
			});


	}]);
})();
(function() {
  'use strict';

  runBlock.$inject = ["$rootScope", "$state"];
  angular
    .module('weatherApp')
    .run(runBlock);

  /** @ngInject */
  function runBlock($rootScope, $state) {

  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {

    if ( toState.name === 'app.forecast' && (toParams.lat === '' || toParams.lon === '') ) {
      console.log('event was prevented');
      event.preventDefault();
    }
  });

  }

})();

(function() {
  'use strict';

  routerConfig.$inject = ["$stateProvider", "$urlRouterProvider"];
  angular
    .module('weatherApp')
    .config(routerConfig);

  /** @ngInject */
  function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('app', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainController',
        controllerAs: 'main'
      })
      .state('app.forecast', {
        url: 'forecast/:lat/:lon',
        templateUrl: 'app/forecast/forecast.html',
        controller: 'ForecastController',
        controllerAs: 'forecast',
        params: {
          lat: { value: '' },
          lon: { value: '' }
        },
      });

    $urlRouterProvider.otherwise('/');
  }

})();

(function() {
  'use strict';

  angular
    .module('weatherApp')
    .constant('config', {
      PROTOCOL:         'http://',
      API_URL:          'api.openweathermap.org',
      PORT:             '',
      API_PATH:         'data/',
      API_VERSION:      '2.5',
      API_KEY:          '4c587b809e3a95f7da6dd36259885bc3',
      FORECAST_ACTION:  'forecast',
      DIR_SEP:          '/'
    });

})();

(function() {
  'use strict';

  config.$inject = ["$logProvider", "toastrConfig"];
  angular
    .module('weatherApp')
    .config(config);

  /** @ngInject */
  function config($logProvider, toastrConfig) {
    // Enable log
    $logProvider.debugEnabled(true);

    // Set options third-party lib
    toastrConfig.allowHtml = true;
    toastrConfig.timeOut = 3000;
    toastrConfig.positionClass = 'toast-top-right';
    toastrConfig.preventDuplicates = true;
    toastrConfig.progressBar = true;
  }

})();

angular.module("weatherApp").run(["$templateCache", function($templateCache) {$templateCache.put("app/forecast/forecast.html","<style>.weather-description div {\n    height: 50px;\n  }</style><h1>{{::forecast.city.name}}</h1><div class=container><div class=row ng-repeat=\"(key, value) in forecast.data track by $index\"><h2>{{key}}</h2><div class=\"col-md-2 weather-description\"><div>Время</div><div>Облачность, %</div><div>Осадки</div><div>Дождь (3ч), мм</div><div>Скорость ветра, м/c</div><div>Направление ветра</div><div>Температура, &deg;С средняя</div><div>Температура, &deg;С максимум</div><div>Температура, &deg;С минимум</div><div>Влажность, %</div><div>Давление, мм рт.ст</div></div><div class=\"col-md col-sm-1\" ng-repeat=\"hour in value track by $index\"><weather ng-model=hour></weather></div></div></div>");
$templateCache.put("app/main/main.html","<div class=container><acme-navbar geo=main.geo></acme-navbar><ui-view></ui-view><input type=text class=geo ng-model=main.geo.address googleplace get-coordinates=main.geo><div ng-if=main.geo.latitude>lat: {{main.geo.latitude}} lon: {{main.geo.longitude}}</div></div>");
$templateCache.put("app/components/navbar/navbar.html","<nav class=\"navbar navbar-static-top navbar-inverse\"><div class=container-fluid><div class=navbar-header><a class=navbar-brand href=#><span class=\"glyphicon glyphicon-home\"></span> Weather APP {{geo}}</a></div><div class=\"collapse navbar-collapse\" id=bs-example-navbar-collapse-6><ul class=\"nav navbar-nav\"><li ng-class=\"{\'active\': vm.$state.is(\'app\')}\"><a ui-sref=app>Home</a></li><li ng-class=\"{\'active\': vm.$state.is(\'app.forecast\')}\"><a href=\"\" ng-click=navbar.changeState()>5 days</a></li></ul></div></div></nav>");
$templateCache.put("app/components/weather/weather.html","<div class=weather-container><div class=time>{{model.time}}</div><div class=\"clouds {{::getCloudness()}}\">{{model.clouds.all}} %</div><div>{{model.weather[0].description}}</div><div>{{model.rain[\'3h\'] || \'n/a\'}}</div><div>{{model.wind.speed || \'n/a\'}}</div><div>{{model.wind.deg || \'n/a\'}}</div><div>{{model.main.temp || \'n/a\'}}</div><div>{{model.main.temp_max || \'n/a\'}}</div><div>{{model.main.temp_min || \'n/a\'}}</div><div>{{model.main.humidity || \'n/a\'}}</div><div>{{model.main.pressure || \'n/a\'}}</div></div><hr>");}]);
//# sourceMappingURL=../maps/scripts/app-639d01cd56.js.map
