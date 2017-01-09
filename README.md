# treecut.js

treecut.js automatically adjusts the level of abstraction of treemaps
as a function of display size.

The abstraction is determined by a tree cut, which is essentially a 
boundary between the visible and hidden parts of the tree.

The tree cut selection algorithm is based on the Minimum Description Length principle. 
To reduce clutter when space is scarce, it sets the cut above subtrees 
that have more uniform scores. This behaviour has the effect of exposing subtrees that
contain nodes with a dramatically disproportionate score (outliers) 
while collapsing regular subtrees. 
Conversely, with more space, the algorithm tends to select lower cuts, allowing more
nodes to be displayed.

You can read the full technical details in our [research paper](##Citation).


## Usage

### With d3.hierarchy

Get your tree ready with d3.hierarchy as usual:

```javascript
var tree =  d3.hierarchy(data);
    .sum(function(d) { return d.children ? d.value : 0; })
    .sort(function(a,b){ return b.value - a.value; });

```

Then let treecut.js adorn it with its own attributes:

```javascript
var treecut = vialab.treecut;
treecut.hierarchy()
    .adornD3(tree);
```

Extract the cut.

```javascript
var cut = treecut.treemap()
    .findcut(tree, 800*600); // 800*600 is the display area, in pixels
```

`findcut` returns an array of nodes that belong to the cut. You can mark the nodes
under the cut as invisible before drawing the treemap:

```javascript
cut.forEach(function(d){
    d.descendants().forEach(function(o,i){
      if (i==0) return;
      o.visible = false;
    });
});
```

## Example

<img src="img/treemap03.png" width="100%"/>
<img src="img/treemap02.png" width="73.38%"/>
<img src="img/treemap01.png" width="33.5%"/>

## Demos

Load the pages on windows of different size to see how the treemap adapts.

### MeSH - Medical Subject Headings

MeSH is a hierarchy of 56,327 categories used to tag PubMed publications. The size of a category encodes the number of papers contained in it. For each category A, a child named (A) represents the number of papers tagged **directly** with A.

**Link:** http://vialab.science.uoit.ca/mesh/

You can compare the view above with the [unabstracted MeSH treemap](http://vialab.science.uoit.ca/mesh/vanilla-treemap.html). 

### DMOZ (Directory Mozilla)

DMOZ is a hierarchical web directory of nearly half a million categories.

**Link:** http://vialab.science.uoit.ca/dmoz/

## Slides (VIS 16 Talk)

Link: http://vialab.ca/treecut/slides

Tip: 

Use keys _W_, _D_, _S_ and _A_ to interact with slides 9 and 12. On slide 12 you can also _click_ on nodes to anchor the tree cut.

Press _K_ for notes.

## Citation

R. Veras; C. Collins, ["Optimizing Hierarchical Visualizations with the Minimum Description Length Principle,"](http://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=7536174&isnumber=4359476) in IEEE Transactions on Visualization and Computer Graphics , vol.23, no.1, pp.631-640.

```
@Article{Veras2017,
Author = { Rafael Veras and Christopher Collins },
Journal= {IEEE Transactions on Visualization and Computer Graphics },
Title= { Optimizing Hierarchical Visualizations with the Minimum Description Length Principle },
Year= {2017},
Volume = { 23 },
Number = { 1 },
Pages= { 631--640},
Keywords = { Hierarchy data, data aggregation, multiscale visualization, tree cut, antichain },
DOI = { 10.1109/TVCG.2016.2598591 },
ISSN = { 1077-2626 },
Month = jan,
}
```
