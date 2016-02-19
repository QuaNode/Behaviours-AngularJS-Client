var app = angular.module("behaviour", []);
var behaviour = app.factory('behaviours', ['$http', function($http) {

	var BehavioursJson = null;
	$http.get('/data').then(function(response) {

		BehavioursJson = response.data;
	}, function(error) {

		throw new Error('Error in initializing Behaviours' + error.message);
	});
	return {

		getBehaviour: function(behaviourName) {

			while (!BehavioursJson);
			if (BehavioursJson[behaviourName]) {

				var behaviour = BehavioursJson[behaviourName];
				return function(behaviourData, callback) {

					var keys = Object.keys(behaviourData);
					var headers = {};
					var data = {};
					var url = behaviour.path;
					var type = null;
					for (var key in keys) {
						type = behaviour.parameters[keys[key]].type;
						switch (type) {

							case 'header':
								headers[behaviour.parameters[keys[key]].key.split('.')[1]] = behaviourData[keys[key]];
								break;
							case 'body':
								var paths = behaviour.parameters[keys[key]].key.split('.');
								var nestedData = data;
								var lastPath = null;
								for (var path in paths) {

									if (lastPath) nestedData = nestedData[lastPath];
									if (!nestedData[paths[path]]) nestedData[paths[path]] = {};
									lastPath = paths[path];
								}
								if (lastPath) nestedData[lastPath] = behaviourData[keys[key]];
								break;
							case 'path':
								url.replace(':' + encodeURIComponent(behaviour.parameters[keys[key]].key), encodeURIComponent(behaviourData[keys[key]].key));
								break;
							case 'query':
								if (url.indexOf('?') === -1) {
									url += '?';
								}
								url += '&' + encodeURIComponent(behaviour.parameters[keys[key]].key) + '=' +
									encodeURIComponent(behaviourData[keys[key]].key);
								break;
						}
					};
					$http({
						method: behaviour.method,
						url: url,
						data: data,
						headers: headers
					}).then(function successCallback(response) {

						callback(response.data, null);
					}, function errorCallback(error) {

						callback(null, error);
					});
				}
			} else {

				throw new Error('This behaviour does not exist.');
			}
			return null;
		}
	}
}]);