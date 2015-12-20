describe('apTransclude', function() {
    describe("Basic usage", function() {
        var elem;
        var scope;

        beforeEach(function() {
            var test = angular.module('test', ['ap-transclude']);
            test.directive('myPanel', function() {
                return {
                    restrict: 'E',
                    transclude: true,
                    template: [
                        '<article class="my-panel" ap-transclude-host>',
                        '<header ap-transclude-slot="header"><b>Header</b></header>',
                        '<ng-transclude></ng-transclude>',
                        '<footer ap-transclude-slot="footer"><b>Footer</b></header>',
                        '</article>'
                    ].join('')
                }
            });
        });

        beforeEach(angular.mock.module('test'));

        beforeEach(inject(function($rootScope, $compile) {
            scope = $rootScope.$new();
            elem = $compile([
                '<my-panel>',
                'Hello, world!',
                '<ap-transclude-fragment into="header"><b>My header</b></ap-transclude-fragment>',
                '<ap-transclude-fragment into="unknown">missing</ap-transclude-fragment>',
                '</my-panel>'
            ].join(''))(scope);
            scope.$digest();
        }));

        it('`apTranscludeFragment` should replace matching `apTranscludeSlot`', function() {
            var header = elem.find('header');
            expect(header.children().length).to.equal(1);
            var b = header.children().eq(0);
            expect(b[0].tagName).to.equal('B');
            expect(b.html()).to.equal('My header');
        });

        it('`apTranscludeFragment` that does not match any `apTranscludeSlot` should get swallowed', function() {
            expect(elem.html().indexOf('missing')).to.equal(-1);
        });

        it('`apTranscludeSlot` that has no matching `apTranscludeFragment` should render default markup', function() {
            var footer = elem.find('footer');
            expect(footer.children().length).to.equal(1);
            var b = footer.children().eq(0);
            expect(b[0].tagName).to.equal('B');
            expect(b.html()).to.equal('Footer');
        });

        it('`apTranscludeFragment` removes itself from resulting markup', function() {
            expect(elem.find('apTranscludeFragment').length).to.equal(0);
        });
    });

    describe("Advanced usage", function() {
        var elem;
        var scope;

        beforeEach(function() {
            var test = angular.module('test', ['ap-transclude']);
            test.directive('myPanelHeader', function() {
                return {
                    restrict: 'E',
                    transclude: true,
                    template: [
                        '<header ap-transclude-host="header">',
                            '<h1 ap-transclude-slot="title"></h1>',
                            '<ng-transclude></ng-transclude>',
                        '</header>'
                    ].join('')
                }
            });
            test.directive('myPanel', function() {
                return {
                    restrict: 'E',
                    transclude: true,
                    template: [
                        '<article class="my-panel" ap-transclude-host>',
                            '<my-panel-header></my-panel-header>',
                            '<ng-transclude></ng-transclude>',
                        '</article>'
                    ].join('')
                }
            });
        });

        beforeEach(angular.mock.module('test'));

        beforeEach(inject(function($rootScope, $compile) {
            scope = $rootScope.$new();
            elem = $compile([
                '<my-panel>',
                    'Hello, world!',
                    '<ap-transclude-fragment into="header.title"><b>My header</b></ap-transclude-fragment>',
                    '<ap-transclude-fragment into="header.unknown">missing</ap-transclude-fragment>',
                    '<ap-transclude-fragment into="unknown">missing</ap-transclude-fragment>',
                '</my-panel>'
            ].join(''))(scope);
            scope.$digest();
        }));

        it('Parent host might provide fragments for nested named host', function() {
            var header = elem.find('h1');
            expect(header.children().length).to.equal(1);
            var b = header.children().eq(0);
            expect(b[0].tagName).to.equal('B');
            expect(b.html()).to.equal('My header');
        });
    });
});
