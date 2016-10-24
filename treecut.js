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


function vialab_treecut_findcut(node, total, fun, args, isRoot){

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
      var subcut = vialab_treecut_findcut(children[i], total, fun, args, false);
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

  treemap.findcut = function(root, displayArea){
    var args = {displayArea: displayArea};

    var cut = vialab_treecut_findcut(root, root.value,
      functions, args, true).members;

    return cut;
  };

  return treemap;
};