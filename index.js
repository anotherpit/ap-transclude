'use strict';

var module = angular.module('ap-transclude', ['ng']);

module.directive('apTranscludeHost', function() {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs, controller) {
            controller.setName($attrs.apTranscludeHost);
            $attrs.$observe('apTranscludeHost', function(name) {
                controller.setName(name);
            });
        },
        controller: function() {

            this._name = undefined;
            this.setName = function(name) {
                this._name = name;
            };
            this.getName = function() {
                return this._name;
            };

            this._parentHost = null;
            this.setParentHost = function(host) {
                this._parentHost = host;
            };
            this.getParentHost = function() {
                return this._parentHost;
            };

            this._fragments = {};
            this.setFragment = function(name, fragment) {
                this._fragments[name] = fragment;
            };
            this.getFragment = function(name) {
                return this._fragments[name];
            };
            this.findFragment = function(name) {
                var fragment = this.getFragment(name);
                if (fragment) { return fragment; }
                var parent = this.getParentHost();
                if (!parent) { return null; }
                return parent.findFragment(this.getName() + '.' + name);
            };
            this.removeFragment = function(name) {
                if (this._fragments[name]) {
                    delete this._fragments[name];
                }
            };
        }
    }
});



module.directive('apTranscludeInto', function() {
    return {
        restrict: 'A',
        transclude: true,
        require: ['apTranscludeInto', '^?apTranscludeHost'],
        link: function($scope, $element, $attrs, controllers) {

            var ctrl = controllers[0];
            var parentHost = controllers[1];

            ctrl.setName($attrs.apTranscludeInto);
            $attrs.$observe('apTranscludeInto', function(name) {
                ctrl.setName(name);
            });

            if (parentHost) { ctrl.setParentHost(parentHost); }
            $scope.$on('$destroy', function() {
                if (parentHost) { ctrl.setParentHost(null); }
            });
        },
        controller: function($transclude) {
            this.$transclude = $transclude;

            this._parentHost = null;
            this.setParentHost = function(host) {
                var oldHost = this.getParentHost();
                if (oldHost === host) { return; }
                var name = this.getName();
                if (oldHost) { oldHost.removeFragment(name); }
                this._parentHost = host;
                if (host) { host.setFragment(name, this); }
            };
            this.getParentHost = function() {
                return this._parentHost;
            };

            this._name = undefined;
            this.setName = function(name) {
                var oldName = this.getName();
                if (oldName === name) { return; }
                var parentHost = this.getParentHost();
                if (parentHost) { parentHost.removeFragment(oldName); }
                this._name = name;
                if (parentHost) { parentHost.setFragment(name, this); }
            };
            this.getName = function() {
                return this._name;
            }
        }
    }
});

module.directive('apTranscludeSlot', function() {
    return {
        restrict: 'A',
        transclude: true,
        require: ['apTranscludeSlot', '^?apTranscludeHost'],
        link: function($scope, $element, $attrs, controllers) {

            var ctrl = controllers[0];
            var parentHost = controllers[1];

            function setName(name) {
                if (ctrl.name === name) { return; }
                var actualCtrl = parentHost && parentHost.findFragment(name) || ctrl;
                actualCtrl.$transclude(function(clone) {
                    $element.empty();
                    $element.append(clone);
                })
            }
            setName($attrs.apTranscludeSlot);
            $attrs.$observe('apTranscludeSlot', setName);
        },
        controller: function($transclude) {
            this.$transclude = $transclude;
        }
    }
});
