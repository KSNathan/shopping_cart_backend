// // create angular app
var registration_validationApp = angular.module("registration_validationApp", []);

registration_validationApp.controller("reg_val_ctrl", function($scope){

});


registration_validationApp.controller("login_val_ctrl", ['$scope', '$http', function ($scope, $http) {
    // default post header
    $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    // send login data
    $http({
        method: 'POST',
        url: '/login',
        data: $.param({
            email: $scope.email,
            password: $scope.password
        }),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function (data, status, headers, config) {
        // handle success things
		$scope.
    }).error(function (data, status, headers, config) {
        // handle error things
    });
}]);

