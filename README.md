# treecut.js

treecut.js automatically adjusts the level of abstraction of treemaps
as a function of display size.

The abstraction is determined by a tree cut, which is essentially a 
boundary between the visible and hidden parts of the tree.

The tree cut selection algorithm is based on the Minimum Description Length principle. 
To reduce clutter when space is scarce, it sets the cut above subtrees that have more uniform scores.

##Usage

### With d3.hierarchy

Get your tree ready with d3.hierarchy as usual:

```
var tree =  d3.hierarchy(data);
    .sum(function(d) { return d.children ? d.value : 0; })
    .sort(function(a,b){ return b.value - a.value; });

```

Then let treecut.js adorn it with its own attributes:

```
var treecut = vialab.treecut;
treecut.hierarchy()
    .adornD3(tree);
```

Extract the cut.

```
var cut = treecut.treemap()
    .findcut(tree, 800*600); // 800*600 is the display area, in pixels
```

`findcut` returns an array of nodes that belong to the cut. You can mark the nodes
under the cut as invisible before drawing the treemap:

```
cut.forEach(function(d){
    d.descendants().forEach(function(o,i){
      if (i==0) return;
      o.visible = false;
    });
});
```

## Example

<img src="img/treemap03.png" style="width: 100%;"/>
<img src="img/treemap02.png" style="width: 73.38%;"/>
<img src="img/treemap01.png" style="width: 33.5%;"/>
