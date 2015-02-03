// namespace
if (!vialab)
	var vialab = {};

// module treecut
vialab.treecut = {};

vialab.treecut.liAbe = new function(){

	// ^P(C) - probability of a category to occur in the sample. 
	// Equation 12 in Li & Abe (1998).
    // f - f(C), the total frequency of words in class C in the sample S
	// s - |S|, # of words in the sample
	var pc = function(f, s) { return f/s; };

	// ^P(n) - probability of a category to occur in the sample, normalized
    // by its number of children. Equation 11 in Li & Abe (1998).
    // pc - ^P(C), probability of a category to occur in the sample. 
    // c  - |C|,  # of children of a class (1 for leaves)
	var pn = function(pc, c){ return pc/c;	};

	/* L(S|T,teta) - data description length. Equation 10 in Li & Abe (1998).
     * pn_list - list of objects of the form {f, p}, where f is the frequency of the class
     * and pn is its ^P(n) value.
	 */
	var ddl = function(pn_list){
		var result = 0;

		pn_list.forEach(function(o){
			if (o.p > 0)
				result += (Math.log(o.p)/Math.log(2))*o.f
		});

		return -result;
	};

	// L(teta|T) - parameter description length. Equation 9 in Li & Abe (1998).
    // lenCut  - number of nodes in the cut
    // sLength - sample size (# of words)
	var pdl = function(lenCut, sLength){
		var k = lenCut - 1;

		return k * (Math.log(sLength)/Math.log(2)) / 2
	};

    // ---------- public methods -----------------

	// Computes the data description length of a cut.
    // This function just 'extracts' from the cut the exact info needed to calculate ddl and calls ddl.
    // cut - a list of objects containing the attributes:
    // 	  className - class_name, 
    //    f     - frequency,
    //    c     - # of children (leaves)
	this.compute_ddl = function(cut, sample_size){
		cut = cut.map(function(o){
			return {f: o.f,
					p: pn(pc(o.f, sample_size), o.c)
			};
		});
		return ddl(cut);
	};

	// Computes the parameter description length of a cut.
    // This function just 'extracts' from the cut the exact info needed to calculate pdl, and calls pdl.
    // cut - a list of objects containing the attributes:
    // 	 className - class_name, 
    //   f     - frequency,
    //   c     - # of children (leaves)
    this.compute_pdl = function(cut, sample_size){
    	return pdl(cut.length, sample_size);
    };

    this.compute_dl = function(cut, sample_size){
    	var ddl = this.compute_ddl(cut, sample_size);
    	var pdl = this.compute_pdl(cut, sample_size);

    	var dl =  ddl + pdl;
     	
     	return dl;
    };
};

vialab.treecut.wagner = function(c){
	return {
		compute_dl: function(cut, sample_size){
			var pdl = vialab.treecut.liAbe.compute_pdl(cut, sample_size),
			    ddl = vialab.treecut.liAbe.compute_ddl(cut, sample_size),
			    weighting_factor = c * (Math.log(sample_size)/Math.log(2)) / sample_size;

			return pdl + weighting_factor*ddl;
		}
	}
};


vialab.treecut.findcut = function(node, sample_size, f, accessor){
	var desc_length = function(cut, sample_size, f, accessor){
		cut = cut.map(accessor);
		return f.compute_dl(cut, sample_size);
	};

	if (!node.children || node.children.length == 0)
		return [node];
	else {
		var c = [];

		node.children.forEach(function(child){
			var subcut = vialab.treecut.findcut(child, sample_size, f, accessor);
			c.push.apply(c, subcut); // add subcut to c
		});


		if (desc_length([node], sample_size, f, accessor) <= desc_length(c, sample_size, f, accessor))
			return [node];
		else
			return c;
	}
};


function test(){
	var cut1 = [{className: 'ANIMAL', f: 10, c: 7}];
	var cut2 = [{className: 'BIRD', f: 8, c: 4}, {className: 'INSECT', f: 2, c:3}];
	var cut3 = [{className: 'BIRD', f: 8, c: 4}, {className: 'bug', f: 0, c: 1}, {className: 'bee', f: 2, c: 1},
		{className: 'insect', f: 0, c: 1}];
	var cut4 = [{className: 'swallow', f: 0, c: 1}, {className: 'crow', f: 2, c: 1}, {className: 'eagle', f: 2, c: 1},
	{className: 'bird', f: 4, c: 1}, {className: 'INSECT', f: 2, c:3}];
	var cut5 = [{className: 'swallow', f: 0, c: 1}, {className: 'crow', f: 2, c: 1}, {className: 'eagle', f: 2, c: 1},
	{className: 'bird', f: 4, c: 1}, {className: 'bug', f: 0, c: 1}, {className: 'bee', f: 2, c: 1},
		{className: 'insect', f: 0, c: 1}];

	console.log(vialab.treecut.liAbe.compute_dl(cut1,10));
	console.log(vialab.treecut.liAbe.compute_dl(cut2,10));
	console.log(vialab.treecut.liAbe.compute_dl(cut3,10));
	console.log(vialab.treecut.liAbe.compute_dl(cut4,10));
	console.log(vialab.treecut.liAbe.compute_dl(cut5,10));

	console.log(vialab.treecut.wagner(10000).compute_dl(cut1, 10));
	console.log(vialab.treecut.wagner(10000).compute_dl(cut2, 10));
	console.log(vialab.treecut.wagner(10000).compute_dl(cut3, 10));
	console.log(vialab.treecut.wagner(10000).compute_dl(cut4, 10));
	console.log(vialab.treecut.wagner(10000).compute_dl(cut5, 10));


	var tree = {
		name: "ANIMAL", count: 10, nLeaves: 7,
		children: [
			{ name: "BIRD", count: 8, nLeaves: 4,
			  children: [
			  	{name: "swallow", count: 0, nLeaves: 1},
			  	{name: "crow", count: 2, nLeaves: 1},
			  	{name: "eagle", count: 2, nLeaves: 1},
			  	{name: "bird", count: 4, nLeaves: 1}
			  ]
			},
			{ name: "INSECT", count: 2, nLeaves: 3,
			  children: [
			  	{name: "bug", count: 0, nLeaves: 1},
			  	{name: "bee", count: 2, nLeaves: 1},
			  	{name: "insect", count: 0, nLeaves: 1}
			  ]
			}
		]
	};

	var accessor = function(node){
		return {className: node.name, f: node.count, c: node.nLeaves};
	};

	var liAbe = vialab.treecut.liAbe;
	console.log(vialab.treecut.findcut(tree, 10, liAbe, accessor));

	var wagner = vialab.treecut.wagner(5);
	console.log(vialab.treecut.findcut(tree, 10, wagner, accessor));
};

module.exports = vialab.treecut