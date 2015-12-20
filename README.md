ap-transclude
=============

AngularJS transclusion on steroids.


Why?
====

Because [named slots for transclusion](http://blog.thoughtram.io/angular/2015/11/16/multiple-transclusion-and-named-slots.html) were introduced only in AngularJS 1.5.x, while are needed by many projects that use older versions of AngularJS. `ap-translude` does provide similar functionality for AngularJS 1.3.x.

Usage
=====

Suppose, you have `myPanel` directive with regular `ngTransclude` that wraps passed markup with a `div` for styling. Declared in `myPanel.js`:
```javascript
myApp.directive('myPanel', function() {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: 'myPanel.html'
    }
});
```
And template in `myPanel.html`:
```html
<article class="my-panel" ng-transclude></article>
```
And used in `index.html`:
```html
<my-panel>
    Hello, world!
</my-panel>
```
Now, let's say you need to add some decoration: header and footer. So you rewrite your `myPanel.html`:
```html
<article class="my-panel">
    <header>Header</header>
    <ng-transclude></ng-transclude>
    <footer>Footer</footer>
</article>
```
OK? Not really. Perhaps, the user would like to be able to pass his/her own header and/or footer. That's where `apTransclude` comes for the rescue. So we rewrite `myPanel.html`:
```html
<article class="my-panel" ap-transclude-host>
    <header ap-transclude-slot="header">Header</header>
    <ng-transclude></ng-transclude>
    <footer ap-transclude-slot="footer">Footer</footer>
</article>
```
What has just happened? We declared `header` and `footer` as template slots (`apTranscludeSlot`s) so that the user can provide his/her own contents for each of them using fragments (`apTranscludeInto`s). For those slots to work we made sure that they have a common `apTranscludeHost` ancestor that is also an ancestor for `ngTransclude` node.
Now user might use your directive in `index.html` like so:
```html
<my-panel>
    Hello, world!
    <div ap-transclude-into="header">My very special header</div>
    <div ap-transclude-into="footer">My very special footer</div>
</my-panel>
```
`apTranscludeInto`s will be removed from `ngTransclude` and placed into `apTranscludeSlot`s with the specified names, so their placement within directive doesn't matter. Thus, user might write `index.html` even so:
```html
<my-panel>
    <div ap-transclude-into="footer">My very special footer</div>
    Hello, world!
    <div ap-transclude-into="header">My very special header</div>
</my-panel>
```
If no matching slot for fragment is found, the fragment is just swallowed not affecting resulting markup. And vice versa: if there's no fragment the slot will be filled with its default markup.
```html
<my-panel>
    Hello, world!
    <div ap-transclude-into="header">My very special header</div>
    <div ap-transclude-into="unknown">This fragment will be swallowed</div>
</my-panel>
```

Advanced usage
==============

Now you want your header to have optional subtitle, and you decide to make it a separate directive using `apTransclude`.
`myPanelHeader.js`
```javascript
myApp.directive('myPanelHeader', function() {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: 'myPanelHeader.html'
    }
});
```
`myPanelHeader.html`
```html
<header ap-transclude-host="header">
    <ng-transclude></ng-transclude>
    <div ap-transclude-slot="title">Title</div>
    <div ap-transclude-slot="subtitle">Subtitle</div>
</header>
```
Note, that we gave our host a name by passing a string value to `apTranscludeHost` attribute. Before we see it in action later, we need to rewrite `myPanel` template directive to use `myPanelHeader`.
`myPanel.html`
```html
<article class="my-panel" ap-transclude-host>
    <my-panel-header></my-panel-header>
    <ng-transclude></ng-transclude>
    <footer ap-transclude-slot="footer">Footer</footer>
</article>
```
So we've just broken our `index.html` since there's no `header` slot available anymore. But instead we can now pass fragments inside deep nested hosts using path names like so:
```html
<my-panel>
    Hello, world!
    <div ap-transclude-into="header.title">Title</div>
    <div ap-transclude-into="header.subtitle">Subtitle</div>
</my-panel>
```
You can even change default path name separator from default `.` to whatever string you want by reassigning `nameDelimiter` property of `apTransclude.config` service:
```index.js
myApp.config(['myApTransclude.config', function(config) {
    config.nameDelimiter = '$$$';
}]);
```

Further
=======

- Each of `apTranscludeHost`, `apTranscludeInto` and `apTranscludeSlot` directives are `transluce:true` and `replace:false` so there might be some excess nodes in markup. We should investigate if we can safely use `replace:true` in conjunction with `ngRepeat`, `ngIf` and so on.
- Looks like we can implement `apTranscludeDefault` directive to inject default slot markup inside `apTranscludeInto`.

Any related contributions are welcome.
