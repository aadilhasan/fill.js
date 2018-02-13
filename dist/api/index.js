const fc = function() {
  this.el = null;
  this.data = {};
  this.nodes = {};
  this.nodeCount = 0;
  this.col = {
    data: [],
    index: 0
  };
};

const updatableData = function(val) {
  this.val = val;
  this.refs = [];
  this.watcher = null;
};

updatableData.prototype.setVal = function(newVal) {
  this.val = newVal;
  return newVal;
};

updatableData.prototype.setRefs = function(ref, dep, nodeNo) {
  this.refs.push({
    ref: ref,
    dep: dep || null,
    nodeNo
  });
};

updatableData.prototype.clearRefs = function(ref, dep) {
  this.refs = [];
};

updatableData.prototype.get = function() {
  return this.val;
};

fc.prototype.parse = parse;
fc.prototype.processArray = process;
fc.prototype.makeTree = makeTree;
fc.prototype.updatable = val => {
  return new updatableData(val);
};

let i = 0;

fc.prototype.updateData = function(key, val, forced = false) {
  let item = this.data[key];
  if (!forced && item.get() == val) {
    return;
  }
  let oldVal = item.val;
  item.setVal(val);
  tempRefs = item.refs;
  item.clearRefs();
  // console.log(" refs ", tempRefs, item.refs, this.data[key]);
  // if (i == 1) return;
  // i++;
  tempRefs.forEach((ref, index) => {
    let nodeCount = this.nodeCount;
    // console.log(" updatig ", ref, nodeCount);
    ref.ref = this.nodes[ref.nodeNo];
    this.nodeCount = parseInt(ref.nodeNo.slice(1));
    // console.log(" new this ", this);
    let newEl = getChildTree(ref.dep, this);
    let parent = ref.ref.parentNode;
    parent.replaceChild(newEl, ref.ref);
    this.nodes[ref.nodeNo] = newEl;
  });
  // console.log(" updated ", this.data[key]);

  if (item.watcher !== null) {
    item.watcher(item.val, oldVal);
  }
};

fc.prototype.watch = function(key, cb) {
  let item = this.data[key];
  item.watcher = cb;
};

// console.log(" parse is  ", fc.prototype.parse);

fc.prototype.init = function(el, data) {
  // console.log(" innt params ", el, data);
  this.el = el;
  this.data = data;
  let parsedArray = this.parse(this.el.outerHTML, this.col);

  let {
    processedData,
    evalFunction,
    evalInitializedVariables
  } = this.processArray(parsedArray);
  this.evalFunction = new Function("data", "exp", evalFunction);
  this.evalFunctionString = evalFunction;
  this.evalInitializedVariables = evalInitializedVariables;
  // console.log(" before making tree ", processedData);
  this.makeTree(processedData, this);
};

window.fill = new fc();
