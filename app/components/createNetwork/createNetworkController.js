angular.module('createNetwork', [])
.controller('CreateNetworkController', ['$q', '$scope', '$state', 'PluginService', 'Notifications', 'Network', 'LabelHelper',
function ($q, $scope, $state, PluginService, Notifications, Network, LabelHelper) {

  $scope.formValues = {
    DriverOptions: [],
    Subnet: '',
    Gateway: '',
    Labels: []
  };

  $scope.availableNetworkDrivers = [];

  $scope.config = {
    Driver: 'bridge',
    CheckDuplicate: true,
    Internal: false,
    // Force IPAM Driver to 'default', should not be required.
    // See: https://github.com/docker/docker/issues/25735
    IPAM: {
      Driver: 'default',
      Config: []
    },
    Labels: {}
  };

  $scope.addDriverOption = function() {
    $scope.formValues.DriverOptions.push({ name: '', value: '' });
  };

  $scope.removeDriverOption = function(index) {
    $scope.formValues.DriverOptions.splice(index, 1);
  };

  $scope.addLabel = function() {
    $scope.formValues.Labels.push({ key: '', value: ''});
  };

  $scope.removeLabel = function(index) {
    $scope.formValues.Labels.splice(index, 1);
  };

  function createNetwork(config) {
    $('#createNetworkSpinner').show();
    Network.create(config, function (d) {
      if (d.message) {
        $('#createNetworkSpinner').hide();
        Notifications.error('Unable to create network', {}, d.message);
      } else {
        Notifications.success('Network created', d.Id);
        $('#createNetworkSpinner').hide();
        $state.go('networks', {}, {reload: true});
      }
    }, function (e) {
      $('#createNetworkSpinner').hide();
      Notifications.error('Failure', e, 'Unable to create network');
    });
  }

  function prepareIPAMConfiguration(config) {
    if ($scope.formValues.Subnet) {
      var ipamConfig = {};
      ipamConfig.Subnet = $scope.formValues.Subnet;
      if ($scope.formValues.Gateway) {
        ipamConfig.Gateway = $scope.formValues.Gateway  ;
      }
      config.IPAM.Config.push(ipamConfig);
    }
  }

  function prepareDriverOptions(config) {
    var options = {};
    $scope.formValues.DriverOptions.forEach(function (option) {
      options[option.name] = option.value;
    });
    config.Options = options;
  }

  function prepareLabelsConfig(config) {
    config.Labels = LabelHelper.fromKeyValueToLabelHash($scope.formValues.Labels);
  }

  function prepareConfiguration() {
    var config = angular.copy($scope.config);
    prepareIPAMConfiguration(config);
    prepareDriverOptions(config);
    prepareLabelsConfig(config);
    return config;
  }

  $scope.create = function () {
    var config = prepareConfiguration();
    createNetwork(config);
  };

  function initView() {
    $('#loadingViewSpinner').show();
    var endpointProvider = $scope.applicationState.endpoint.mode.provider;
    var apiVersion = $scope.applicationState.endpoint.apiVersion;
    if(endpointProvider !== 'DOCKER_SWARM') {
      PluginService.networkPlugins(apiVersion < 1.25)
      .then(function success(data){
          $scope.availableNetworkDrivers = data;
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve network drivers');
      })
      .finally(function final() {
        $('#loadingViewSpinner').hide();
      });
    }
  }

  initView();
}]);
