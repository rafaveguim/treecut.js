// --------------------------------------------------------------------------
// Copyright 2015 Rafael Veras Guimaraes
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ===========================================================================


if (!vialab)
  var vialab = {};

vialab.treecut = {};

function log2(x){ return Math.log(x)/Math.log(2); }

// ^P(n) - probability of a category to occur in the sample, normalized
// by the number of children. Equation 11 in Li & Abe (1998).
// pc - ^P(C), probability of a category to occur in the sample.
// c  - |C|,  # of children of a class (1 for leaves)
function pn(pc, c){ return pc/c; }

// ^P(C) - probability of a category to occur in the sample.
// Equation 12 in Li & Abe (1998).
// f - f(C), the total frequency of words in class C in the sample S
// s - |S|, # of words in the sample
function pc(f, s){ return f/s; }

function ddl(pn_list){
  var result = 0;

  pn_list.forEach(function(o){
    if (o.p > 0)
      result += log2(o.p) * o.f;
  });

  return -result;
}

vialab.treecut.hierarchy = function(){

  var getter   = function(attr){return function(node){return node[attr];}},
      children = getter("children"),
      value    = getter("value"),
      publico  = {};

  publico.adornD3 = function(root){
    var nodes  = root.descendants();

    for (i = nodes.length - 1; i > -1; i--)
      nodes[i].nLeaves = 0;

    nodes.shift();

    for (i = nodes.length - 1; i > -1; i--)
      nodes[i].parent.nLeaves += nodes[i].children ? nodes[i].nLeaves : 1;

    return root;
  }
  
  publico.adorn = function(root){
    // set depth, leaves value, p
    var stack = [root],
        nodes = [];
    root.depth = 0;

    while (stack.length){
      var node   = stack.pop(),
          childs = children.call(publico, node);
      for (var i = 0, len = childs.length; i < len; i++){
        childs[i].depth  = node.depth + 1;
        childs[i].parent = node;
        stack.push(childs[i]);
      }
      node.value   = len ? 0 : +value.call(publico, node);
      node.nLeaves = 0;
      nodes.push(node);

    }
    // var totalValue = nodes.reduce(function(acc, v){return acc + v.value;});

    for (i = nodes.length - 1; i > -1; i--){
      var parent = nodes[i].parent;
      if (parent) {
        parent.value   += nodes[i].value;
        parent.nLeaves += nodes[i].children.length ? nodes[i].nLeaves : 1;
      }
    }
    return root;
  }

  publico.children = function(x){
    if (!arguments.length) return children;
    children = x;
    return publico;
  };

  publico.value = function(x){
    if (!arguments.length) return value;
    value = x;
    return publico;
  };

  return publico;
};


function vialab_treecut_findcut(node, total, fun, accessor, args, isRoot){

  var children   = node.children,
      rootCut    = [node],
      rootCutDDL = fun.ddl(rootCut, total, args),
      rootCutPDL = fun.pdl(rootCut, args),
      rootCutDL  = rootCutDDL + rootCutPDL;

  if (!children || !children.length){
    return {ddl: rootCutDDL, pdl: rootCutPDL, members: rootCut};
  }
  else {
    var childrenCut = {members: [], ddl: 0, pdl: 0};

    for (var i = 0; i < children.length; i++){
      var subcut = vialab_treecut_findcut(children[i], total, fun, accessor, args, false);
      subcut.members.forEach(function(m){ childrenCut.members.push(m);});
      childrenCut.ddl += subcut.ddl;
      childrenCut.pdl += subcut.pdl;
    }

    var childrenCutDL = childrenCut.pdl + childrenCut.ddl;

   // ----------------- debug -------------------//
    // var name = function(n){ return n.name;};

  //  console.log("%s; dl: %d; pdl: %d; ddl: %d",
  //    childrenCut.members.map(name), childrenCutDL, childrenCut.pdl, childrenCut.ddl);
  //  console.log("%s; dl: %d; pdl: %d; ddl: %d", rootCut.map(name), rootCutDL, rootCutPDL,
  //    rootCutDDL);
  //  console.log("================================================");
   //--------------------------------------------//

    if (rootCutDL <= childrenCutDL && !isRoot)
      return {members: rootCut, ddl: rootCutDDL, pdl: rootCutPDL};
    else
      return childrenCut;
  }
}

vialab.treecut.treemap = function(minArea){
  var treemap   = {},
      functions = {},
      minProb   = Math.pow(10,-12);

  if (minArea == undefined) minArea = 10*10;

  functions.ddl = function(cut, total, args){
    var displayArea = args.displayArea;

    cut = cut.map(function(node){
      var area = displayArea*node.value/total;

      return {f: area,
          // p: pn(Math.pow(10,-12) + Math.round(area)/displayArea, o.c)
          p: pn(Math.floor(area) <= minArea ? minProb : Math.round(area)/displayArea,
            node.nLeaves ? node.nLeaves : 1)
      };
    });

    return ddl(cut);
  };

  functions.pdl = function(cut, args){
    return 2*cut.length*log2(args.displayArea);
  };

  treemap.findcut = function(root, total, accessor, displayArea){
    var args = {displayArea: displayArea};

    var cut = vialab_treecut_findcut(root, total,
      functions, accessor, args, true).members;

    return cut;
  };

  return treemap;
};


// Centroid function from D3.js, for reference. halfpi is just an offset
// arc.centroid = function() {
//   var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
//   a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - halfπ;
//   return [ Math.cos(a) * r, Math.sin(a) * r ];
// };

vialab.treecut.sunburst = function(){
  var sunburst  = {},
      functions = {},
      c = Math.pow(10,-8), // a penalizing constant for ddl
      doublepi = 2 * Math.PI;

  functions.pdl = function(cut, args){
    return cut.length * args.nodePDLcost;
  };

  // this is the ara of the segment, not the area of the ring!
  functions.segmentArea = function(outerRadius, innerRadius){
    var angle = 2*Math.PI;
    return (angle - Math.sin(angle)) *
      (Math.pow(outerRadius, 2) - Math.pow(innerRadius, 2)) / 2;
  };

  // https://en.wikipedia.org/wiki/Circular_sector
  // angle is in radians
  functions.diskSectorArea = function(angle, radius){
    return angle * Math.pow(radius,2) / 2;
  };

  functions.ddl = function(cut, total, args){
    var countInvisible   = 0, // # of leaves under invisible nodes
        accInvisibleProb = 0;

    // accumulated invisible probabilities
    for (var i = 0; i < cut.length; i++){
      var node = cut[i];
      if (node.depth > args.depthThreshold) return -Number.NEGATIVE_INFINITY;

      if (node.p < args.minP[node.depth]) {
        countInvisible   += node.nLeaves;
        accInvisibleProb += node.p;
      }
    }

    var ddl = 0;
    for (var i = 0; i < cut.length; i++){
      var node = cut[i];

      if (node.value <= 0) continue;

      var angle    = node.p * doublepi, // in radians
          diskArea = functions.diskSectorArea(angle, args.radius); // in radians
      ddl -= diskArea * log2(node.p >= args.minP[node.depth] ? node.p/node.nLeaves
                        : accInvisibleProb/countInvisible);
    }

    return ddl;
  };

  sunburst.findcut = function(root, total, accessor, radius, maxDepth){
    var args = {radius: radius, maxDepth: maxDepth, total: total};

    // the deeper the cut, the smaller is the arc length
    // so we minimize the treecut over all possible depths

    var minCut = null;

    console.log("root.depth: " + root.depth);
    console.log(" threshold |         ddl |        pdl |          dl ");

    for (var depthThreshold = maxDepth; depthThreshold > root.depth; depthThreshold--){
    // for (var depthThreshold = 6; depthThreshold > 1; depthThreshold--){
      args.depthThreshold = depthThreshold;
      args.nLevels  = (depthThreshold - root.depth) + 1;
      args.levelWidth = args.radius / args.nLevels;
      args.nodePDLcost = 2*log2(args.radius*2);
      args.minP = {}; // min prob. to get arclength >= 1 px at each depth
      for (var depth = 0; depth <= args.maxDepth; depth++){
        var levelRadius  = (depth + 1) * args.levelWidth;
        args.minP[depth] = 1 / (doublepi * levelRadius);
      }

      var cut = vialab_treecut_findcut(root, total,
        functions, accessor, args, true);

      console.log(sprintf("%10u | %11.3f | %10.3f | %10.3f",
        depthThreshold, cut.ddl, cut.pdl, (cut.pdl + cut.ddl)));

      if (minCut === null || (cut.ddl + cut.pdl) < (minCut.ddl + minCut.pdl))
        minCut = cut;
    }

    return minCut.members;
  };
  return sunburst;
};




function test(){
  // var cut1 = [{name: 'ANIMAL', f: 10, c: 7}];
  // var cut2 = [{name: 'BIRD', f: 8, c: 4}, {name: 'INSECT', f: 2, c:3}];
  // var cut3 = [{name: 'BIRD', f: 8, c: 4}, {name: 'bug', f: 0, c: 1}, {name: 'bee', f: 2, c: 1},
  //   {name: 'insect', f: 0, c: 1}];
  // var cut4 = [{name: 'swallow', f: 0, c: 1}, {name: 'crow', f: 2, c: 1}, {name: 'eagle', f: 2, c: 1},
  // {name: 'bird', f: 4, c: 1}, {name: 'INSECT', f: 2, c:3}];
  // var cut5 = [{name: 'swallow', f: 0, c: 1}, {name: 'crow', f: 2, c: 1}, {name: 'eagle', f: 2, c: 1},
  // {name: 'bird', f: 4, c: 1}, {name: 'bug', f: 0, c: 1}, {name: 'bee', f: 2, c: 1},
  //   {name: 'insect', f: 0, c: 1}];

  // console.log(vialab.treecut.liAbe.compute_dl(cut1,10));
  // console.log(vialab.treecut.liAbe.compute_dl(cut2,10));
  // console.log(vialab.treecut.liAbe.compute_dl(cut3,10));
  // console.log(vialab.treecut.liAbe.compute_dl(cut4,10));
  // console.log(vialab.treecut.liAbe.compute_dl(cut5,10));

  // console.log(vialab.treecut.wagner(10000).compute_dl(cut1, 10));
  // console.log(vialab.treecut.wagner(10000).compute_dl(cut2, 10));
  // console.log(vialab.treecut.wagner(10000).compute_dl(cut3, 10));
  // console.log(vialab.treecut.wagner(10000).compute_dl(cut4, 10));
  // console.log(vialab.treecut.wagner(10000).compute_dl(cut5, 10));


  var tree = {
    name: "ANIMAL", count: 10, nLeaves: 7,
    children: [
      { name: "BIRD", count: 8, nLeaves: 4,
        children: [
          {name: "swallow", count: 0, nLeaves: 1, children: []},
          {name: "crow", count: 2, nLeaves: 1, children: []},
          {name: "eagle", count: 2, nLeaves: 1, children: []},
          {name: "bird", count: 4, nLeaves: 1, children: []}
        ]
      },
      { name: "INSECT", count: 2, nLeaves: 3,
        children: [
          {name: "bug", count: 0, nLeaves: 1, children: []},
          {name: "bee", count: 2, nLeaves: 1, children: []},
          {name: "insect", count: 0, nLeaves: 1, children: []}
        ]
      }
    ]
  };

  var accessor = function(node){
    return {name: node.name, f: node.count, c: node.nLeaves};
  };

  var args = {minNodeArea: 0, displayArea: 90, nDataPoints: 7};
  var liAbe = vialab.treecut.liAbe;
  console.log(vialab.treecut.findcut(tree, 10, liAbe, accessor, args));

  // var wagner = vialab.treecut.wagner(5);
  // console.log(vialab.treecut.findcut(tree, 10, wagner, accessor, args));
};

// module.exports = vialab.treecut;

//TODO: adopt D3 convention of leaves having no children attribute
//      test and improve sunburst
//      add convenience parameters (weight)
//      review license
//      upload to npm



 // test();
