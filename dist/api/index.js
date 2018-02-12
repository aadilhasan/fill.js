const fc = function() {
  this.el = null;
  this.data = {};
};

const col = {
  data: [],
  index: 0
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

updatableData.prototype.setRefs = function(ref, dep) {
  this.refs.push({
    ref: ref,
    dep: dep || null
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

fc.prototype.updateData = function(key, val) {
  let item = this.data[key];
  let oldVal = item.val;
  item.setVal(val);
  tempRefs = item.refs;
  item.clearRefs();
  console.log(" refs ", item.refs);
  tempRefs.forEach((ref, index) => {
    let newEl = getChildTree(ref.dep, this.data);
    let parent = ref.ref.parentNode;
    parent.replaceChild(newEl, ref.ref);
  });

  if (item.watcher !== null) {
    item.watcher(item.val, oldVal);
  }
};

fc.prototype.watch = function(key, cb) {
  let item = this.data[key];
  item.watcher = cb;
};

console.log(" parse is  ", fc.prototype.parse);

fc.prototype.init = function(el, data) {
  console.log(" innt params ", el, data);
  this.el = el;
  this.data = data;
  let parsedArray = this.parse(this.el.outerHTML, col);

  let processed = this.processArray(parsedArray);
  this.makeTree(processed, this.data, this.el);
};

const fill = new fc();
