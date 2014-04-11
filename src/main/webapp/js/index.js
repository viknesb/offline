/**
 * 
 */
var app = angular.module("offlineApp",["LocalStorageModule","controllers","services"]);

app.run(function($window) {
	$window.addEventListener('load', function() {
		$window.applicationCache.addEventListener('updateready', function() {
			if ($window.applicationCache.status == $window.applicationCache.UPDATEREADY) {
				// Browser downloaded a new app cache.
				$window.location.reload();
			}
		}, false);
	}, false);
});

angular.module("controllers", ["LocalStorageModule","services"]).
	controller("ViewCtrl",["$window","$rootScope","$scope","$timeout","Server","Storage", function($window,$rootScope,$scope,$timeout,Server,Storage) {
		
		$scope.checkConnectivity = function() {
			Server.checkAvailability().then(function(isAvailable) {
				console.log("Checking server availablity!");
				$rootScope.online = isAvailable;
				if(isAvailable) {
					$scope.sendQueuedMsgs();
					// Reset back to checking for availability every 15 secs
					$rootScope.timeOutInMillisecs = 15000;
				}
			});
		};
		
		$scope.sendQueuedMsgs = function() {
			Server.sendQueuedMsgs().success(function() {
				var quedMsgs = Storage.getQueuedMsgs();
				var sentMsgs = $scope.sentMsgs;
				for(var i=0;i<quedMsgs.length;i++) {
					sentMsgs.push(quedMsgs[i]);
				}
				$scope.sentMsgs = sentMsgs;
				$scope.queuedMsgs = [];
				Storage.clearMessages();
			});
		};
		
		/*$window.addEventListener("focus", function () {
			$scope.checkConnectivity();
		}, false);
		$window.addEventListener("blur", function () {
			$timeout.cancel(recursion);
		}, false);*/
		
		$scope.sentMsgs = [];
		$scope.queuedMsgs = Storage.getQueuedMsgs();
		
		$scope.send = function() {
			var msg = $scope.message;
			$scope.message = "";
			$scope.isSending = true;
			Server.sendMessage(msg).then(function(success) {
				if(success) {
					$scope.sentMsgs.push(msg);
				} else {
					$scope.queuedMsgs.push(msg);	
				}
				$scope.isSending = false;
			});
		};
				
	}]).
	controller("TimerCtrl", ["$rootScope","$scope","$timeout", function($rootScope, $scope, $timeout) {

		$rootScope.timeOutInMillisecs = 0;
		var factor = 1;
		$scope.tryAgain = function() {
			if(!$rootScope.online && factor<900) {
				if(factor<15)
					factor=15;
				else if(factor<60)
					factor*=2;
				else {
					if(factor==60)
						factor=0;
					factor+=300;
				}
			} else if($scope.online) {
				factor=15;
			}
	    	$rootScope.timeOutInMillisecs = factor*1000;
	    	$scope.checkConnectivity();
	    };
	    
	    $scope.onTimeout = function(){
			$rootScope.timeOutInMillisecs-=1000;
			if($rootScope.timeOutInMillisecs<0) {
				$scope.tryAgain();
			}
	        $timeout($scope.onTimeout,1000);
	    };
	    $scope.onTimeout();
	}]);


angular.module("services",["LocalStorageModule"]).
	factory("Server", ["$http","Storage", function($http, Storage) {
		return {
			checkAvailability : function() {
				return $http({method : "HEAD", url : "api/available", cache:false}).
					then(function(response) {
						var status = response.status;
						return (status>=200 && status<300 || status===304);
					}, function(error) {
						return false;
					});
			
			},
			sendMessage : function(msg) {
				return $http({method : "POST", url : "api/addMessage", data : {message : msg}}).
					then(function(data) {
						return true;
					}, function(data) {
						Storage.addMsgToQueue(msg);
						return false;
					});
			},
			sendQueuedMsgs : function() {
				var queuedMsgs = Storage.getQueuedMsgs();
				if(queuedMsgs.length>0) {
					return $http({method : "POST", url : "api/addMessages", data : {messages : queuedMsgs}}).
					success(function(data, status, headers, config) {
						return;
					}).error( function(data, status, headers, config) {
						return;
					});	
				}
				var notAnActualPromise = {};
				notAnActualPromise.success = function(){};
				return notAnActualPromise;
			}
		};
	}]).
	factory("Storage", ["localStorageService", function(localStorageService) {
		return {
			getQueuedMsgs : function() {
				var data = localStorageService.get('queuedMsgs');
				var msgs = [];
				if(data!=null && data!="") {
					msgs = JSON.parse(data);
				}
				return msgs;
			},
			addMsgToQueue : function(msg) {
				var existingMsgs = this.getQueuedMsgs();
				existingMsgs.push(msg);
				localStorageService.set('queuedMsgs',JSON.stringify(existingMsgs));
			},
			clearMessages : function(msg) {
				localStorageService.clearAll();
			},
		};
	}]);