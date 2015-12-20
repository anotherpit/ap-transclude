'use strict';

/**
 * @ngdoc module
 * @name apTranscludes
 */
var module = angular.module('ap-transclude', ['ng']);

/**
 * @ngdoc service
 * @name 'apTransclude.config'
 *
 * @type Object
 * @property {string} [nameDelimiter='.']
 */
module.constant('apTransclude.config', {
    nameDelimiter: '.'
});

/**
 * @ngdoc directive
 * @name apTranscludeHost
 * @element ANY
 * @restrict A
 *
 * @description
 * Denotes root element in your template
 * that contains all slots and receives all fragments:
 * - it must be an ancestor for all `apTranscludeSlot` nodes;
 * - it must be an ancestor for `ngTransclude` node
 *  that is supposed to contain `apTranscludeInto` nodes when resolved;
 *
 * @param {string} [apTranscludeHost] Name of this host
 */
module.directive('apTranscludeHost', function() {
    return {
        restrict: 'A',
        require: ['apTranscludeHost', '?^^apTranscludeHost'],
        link: function($scope, $element, $attrs, controllers) {

            var ctrl = controllers[0];
            var parentHost = controllers[1];

            if (parentHost) { ctrl.setParentHost(parentHost); }
            $scope.$on('$destroy', function() {
                if (parentHost) { ctrl.setParentHost(null); }
            });

            ctrl.setName($attrs.apTranscludeHost);
            $attrs.$observe('apTranscludeHost', function(name) {
                ctrl.setName(name);
            });
        },
        /**
         * @ngdoc type
         * @name apTranscludeHost.ApTranscludeHostController
         */
        controller: ['apTransclude.config', function(config) {
            /** @type {string} */
            this._name = undefined;

            /** @type {Object.<string, apTranscludeHost.ApTranscludeHostController|null>} */
            this._parentHost = null;

            /** @type {Object.<string, apTranscludeInto.ApTranscludeIntoController|null>} */
            this._fragments = {};

            /** @param {string} name */
            this.setName = function(name) { this._name = name; };

            /** @returns {string|undefined} */
            this.getName = function() { return this._name; };

            /** @param {apTranscludeHost.ApTranscludeHostController|null} host */
            this.setParentHost = function(host) { this._parentHost = host; };

            /** @returns {apTranscludeHost.ApTranscludeHostController|null} */
            this.getParentHost = function() { return this._parentHost; };

            /**
             * @param {string} name Fragment name
             * @param {apTranscludeInto.ApTranscludeIntoController} fragment Fragment controller
             */
            this.setFragment = function(name, fragment) {
                this._fragments[name] = fragment;
            };

            /**
             * Get fragment registered in this host by name
             * @param {string} name Fragment name
             * @returns {apTranscludeInto.ApTranscludeIntoController|null}
             */
            this.getFragment = function(name) {
                return this._fragments[name] || null;
            };

            /**
             * Find fragment by name starting from this host and up the hierarchy
             *
             * Suppose you have directive that uses transclude host named `a`,
             * that contains another directive that uses transclude host named `b`,
             * that contains slot named `slot`. To pass fragment for `slot`
             * to root directive user have to name it `b.slot`. That's how
             * the fragment will be registered in the root host.
             *
             * To find this template we might use any of these:
             * - rootHostCtrl.getFragment('b.slot');
             * - rootHostCtrl.findFragment('b.slot');
             * - nestedHostCtrl.findFragment('slot');
             * Though the following won't work:
             * - nestedHostCtrl.getFragment('slot');
             * - nestedHostCtrl.findFragment('b.slot');
             *
             * @param {string} name Fragment name
             * @returns {apTranscludeInto.ApTranscludeIntoController|null}
             */
            this.findFragment = function(name) {
                var fragment = this.getFragment(name);
                if (fragment) { return fragment; }
                var parent = this.getParentHost();
                if (!parent) { return null; }
                return parent.findFragment([
                    this.getName(),
                    name
                ].join(config.nameDelimiter));
            };

            /** @param {string} name Fragment name */
            this.removeFragment = function(name) {
                if (this._fragments[name]) {
                    delete this._fragments[name];
                }
            };
        }]
    }
});

/**
 * @ngdoc directive
 * @name apTranscludeInto
 * @restrict A
 * @element ANY
 *
 * @description
 * Fragment to transclude into template's slot.
 *
 * Typically, you'll have directive that uses template
 * that contains `apTranscludeHost` node that has several named
 * `apTranscludeSlot`s. When you use this directive in your markup
 * you put one or more named `apTranscludeInto's inside this directive
 * so that they get resolved into slots.
 *
 * @param {string} apTranscludeInto Name of slot to transclude into
 */
module.directive('apTranscludeInto', function() {
    return {
        restrict: 'A',
        transclude: true,
        require: ['apTranscludeInto', '^?apTranscludeHost'],
        link: function($scope, $element, $attrs, controllers) {
            $element.remove();

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
        /**
         * @ngdoc type
         * @name apTranscludeInto.ApTranscludeIntoController
         */
        controller: ['$transclude', function($transclude) {
            this._transclude = $transclude;

            /** @type {apTranscludeHost.ApTranscludeHostController|null} */
            this._parentHost = null;

            /** @type {string}
            this._name = undefined;

            /** @param {apTranscludeHost.ApTranscludeHostController|null} host */
            this.setParentHost = function(host) {
                var oldHost = this.getParentHost();
                if (oldHost === host) { return; }
                var name = this.getName();
                if (oldHost) { oldHost.removeFragment(name); }
                this._parentHost = host;
                if (host) { host.setFragment(name, this); }
            };

            /** @returns {apTranscludeHost.ApTranscludeHostController|null} */
            this.getParentHost = function() { return this._parentHost; };

            /** @param {string} name */
            this.setName = function(name) {
                var oldName = this.getName();
                if (oldName === name) { return; }
                var parentHost = this.getParentHost();
                if (parentHost) { parentHost.removeFragment(oldName); }
                this._name = name;
                if (parentHost) { parentHost.setFragment(name, this); }
            };

            /** @returns {string} */
            this.getName = function() { return this._name; }
        }]
    }
});

/**
 * @ngodc directive
 * @name apTranscludeSlot
 * @element ANY
 * @restrict A
 *
 * @description
 * Named slot inside `apTranscludeHost` to get replaced with
 * fragment (`apTranscludeInto` directive). If the fragment isn't provided
 * default markup (transcluded content of `apTranscludeSlot`) is used.
 *
 * @param {string} apTranscludeSlot Slot name
 */
module.directive('apTranscludeSlot', function() {
    return {
        restrict: 'A',
        transclude: true,
        require: ['apTranscludeSlot', '^^apTranscludeHost'],
        link: function($scope, $element, $attrs, controllers) {

            var ctrl = controllers[0];
            var parentHost = controllers[1];

            function setName(name) {
                if (ctrl.name === name) { return; }
                var actualCtrl = parentHost && parentHost.findFragment(name) || ctrl;
                actualCtrl._transclude(function(clone) {
                    $element.empty();
                    $element.append(clone);
                });
            }
            setName($attrs.apTranscludeSlot);
            $attrs.$observe('apTranscludeSlot', setName);
        },
        /**
         * @ngdoc type
         * @name apTranscludeSlot.ApTranscludeSlotController
         */
        controller: ['$transclude', function($transclude) {
            this._transclude = $transclude;
        }]
    }
});
