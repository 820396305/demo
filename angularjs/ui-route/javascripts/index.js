var app = angular.module('app',['ui.router']);
app.config(function($stateProvider,$urlRouterProvider){
	$urlRouterProvider.otherwise('/admin');
	$stateProvider
		.state('admin',{
			url:'/admin',
			views:{
				'':{
					templateUrl:'template/admin/index.html',
					controller:function($rootScope,$state){
						$rootScope.title = '后台管理中心';
					}
				},
				'nav@admin':{
					templateUrl:'template/admin/nav.html',
					controller:function($rootScope,$state){

					}
				},
				'siderbar@admin':{
					templateUrl:'template/admin/siderbar.html'
				},
				'container@admin':{
					templateUrl:'template/admin/welcome.html'
				}
			}
		})
		.state('admin.userlist',{
			url:'/userlist',
			views:{
				'container@admin':{
					templateUrl:'template/admin/userlist.html',
					controller:'userListCtrl'
				}
			}
		})
		.state('admin.detail',{
			url:'/detail/:userId',
			views:{
				'container@admin':{
					templateUrl:'template/admin/detail.html',
					controller: function ($scope,$stateParams,$http) {
			            $http.get('/demo/angularjs/ui-route/data/users.json')
						.success(function(rs){
							for(var x in rs){
								if(rs[x].userId == $stateParams.userId){
									$scope.user = rs[x];
									return;
								}
							}
						});
			        }
				}
			}
		})
	//登陆
	$stateProvider
		.state('login',{
			url:'/login',
			views:{
				'':{
					templateUrl:'template/admin/login.html',
					//controller:'loginCtrl'
				}
			}
		})
});

// controller
app.controller('loginCtrl',function($scope,$state,$rootScope){
	$rootScope.title = '用户登陆';
	$scope.loginCheck = function(){
		if($scope.userName == 'admin@xxx.com' && $scope.userPwd == '123'){
			$rootScope.user = {userName:$scope.userName,userPwd:$scope.userPwd};
			$state.go('admin');
		}else{
			alert('用户名或密码错误');
		}
	}
})

app.controller('userListCtrl',function($scope,$http){
	$http.get('/demo/angularjs/ui-route/data/users.json')
	.success(function(rs){
		$scope.users = rs;
	});
})