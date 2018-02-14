(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var parse = require("../parser");
var process = require("../processor");

var _require = require("../tree"),
    makeTree = _require.makeTree,
    getChildTree = _require.getChildTree;

var fc = function fc() {
  this.el = null;
  this.data = {};
  this.nodes = {};
  this.nodeCount = 0;
  this.col = {
    data: [],
    index: 0
  };
};

var updatableData = function updatableData(val) {
  this.val = val;
  this.refs = [];
  this.watcher = null;
};

updatableData.prototype.setVal = function (newVal) {
  this.val = newVal;
  return newVal;
};

updatableData.prototype.setRefs = function (ref, dep, nodeNo) {
  this.refs.push({
    ref: ref,
    dep: dep || null,
    nodeNo: nodeNo
  });
};

updatableData.prototype.clearRefs = function (ref, dep) {
  this.refs = [];
};

updatableData.prototype.get = function () {
  return this.val;
};

fc.prototype.parse = parse;
fc.prototype.processArray = process;
fc.prototype.makeTree = makeTree;
fc.prototype.updatable = function (val) {
  return new updatableData(val);
};

var i = 0;

fc.prototype.updateData = function (key, val) {
  var _this = this;

  var forced = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  var item = this.data[key];
  if (!forced && item.get() == val) {
    return;
  }
  var oldVal = item.val;
  item.setVal(val);
  var tempRefs = item.refs;
  item.clearRefs();
  // console.log(" refs ", tempRefs, item.refs, this.data[key]);
  // if (i == 1) return;
  // i++;
  tempRefs.forEach(function (ref, index) {
    var nodeCount = _this.nodeCount;
    // console.log(" updatig ", ref, nodeCount);
    ref.ref = _this.nodes[ref.nodeNo];
    _this.nodeCount = parseInt(ref.nodeNo.slice(1));
    // console.log(" new this ", this);
    var newEl = getChildTree(ref.dep, _this);
    var parent = ref.ref.parentNode;
    parent.replaceChild(newEl, ref.ref);
    _this.nodes[ref.nodeNo] = newEl;
  });
  // console.log(" updated ", this.data[key]);

  if (item.watcher !== null) {
    item.watcher(item.val, oldVal);
  }
};

fc.prototype.watch = function (key, cb) {
  var item = this.data[key];
  item.watcher = cb;
};

// console.log(" parse is  ", fc.prototype.parse);

fc.prototype.init = function (el, data) {
  // console.log(" innt params ", el, data);
  this.el = el;
  this.data = data;
  var parsedArray = this.parse(this.el.outerHTML, this.col);

  var _processArray = this.processArray(parsedArray),
      processedData = _processArray.processedData,
      evalFunction = _processArray.evalFunction,
      evalInitializedVariables = _processArray.evalInitializedVariables;

  this.evalFunction = new Function("data", "exp", evalFunction);
  this.evalFunctionString = evalFunction;
  this.evalInitializedVariables = evalInitializedVariables;
  this.updatable = updatableData;
  // console.log(" before making tree ", processedData);
  this.makeTree(processedData, this);
};

window.fill = new fc();

},{"../parser":2,"../processor":3,"../tree":4}],2:[function(require,module,exports){
"use strict";

var parse = function parse(str, col) {
  // console.log(" =========  parse ========= ", col, str.length);
  removeWhiteSpace(str, col);
  var index = col.index;

  if (index >= str.length) return;

  if (str[index] == "<" && str[index + 1] == "/") {
    col.index += 2;
    getClosingTagName(str, col);
    return;
  }

  if (str[index] == "<" && str[index + 1] == "!") {
    skipComments(str, col);
    removeWhiteSpace(str, col);
    getTextFromContent(str, col);
  }

  if (str[index] === "<") {
    col.index += 1;
    var isSelfClosing = getTagName(str, col);
    // console.log(" is self closing ", isSelfClosing);

    // do not check for content if the tag is self closing
    if (!isSelfClosing) {
      getContent(str, col);
    }

    if (col.index < str.length) {
      parse(str, col);
    }
  }

  return col;
};

var selfClosingTags = ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];

var getContent = function content(str, col) {
  // console.log(" =========  content ============== ", col);

  if (col.index >= str.length) return;

  getTextFromContent(str, col);

  var index = col.index;

  // console.log(" content ", col);

  if (str[index] == "<") {
    // console.log(" calling parse");
    parse(str, col);
    // console.log(" returned from parse ", col);
  }
};

var getTextFromContent = function getTextFromContent(str, col) {
  var index = col.index;
  var content = "";
  while (str[index] !== "<") {
    content += str[index];
    index += 1;
    // console.log(str[index]);
  }

  col.index = index;

  col.data.push({
    type: "text",
    value: content
  });
};

var getTagName = function tagName(str, col) {
  // console.log(" =========  tag name ============== ", col);

  var index = col.index;
  var tag = "";

  if (index >= str.length) return;

  while (str[index] !== " " && str[index] !== ">") {
    tag += str[index];
    index += 1;
  }

  col.index = index;

  var tagType = selfClosingTags.indexOf(tag) !== -1 ? "self-closing" : "open";

  col.data.push({
    type: "tag",
    tagType: tagType,
    value: tag
  });

  // console.log(" col is ", col, index);

  getAttributes(str, col);
  // console.log(" got attrs ", col, str.substr(col.index, col.index + 5));
  return tagType == "self-closing";
};

var getClosingTagName = function getClosingTagName(str, col) {
  var index = col.index;
  var tag = "";

  if (index >= str.length) return;

  while (str[index] !== ">") {
    tag += str[index];
    index += 1;
  }
  index += 1;
  col.index = index;

  col.data.push({
    type: "tag",
    tagType: "close",
    value: tag
  });
};

var getAttributes = function attributes(str, col) {
  removeWhiteSpace(str, col);

  if (str[col.index] == ">") {
    col.index += 1;
    return;
  }

  var attrValue = "";
  var attrName = getAttrName(str, col);
  var index = col.index,
      len = str.length;

  if (index >= str.length) return;
  // console.log(" item ", str[index], index);

  while (index < len && str[index] !== '"' && str[index] !== "'") {
    attrValue += str[index];
    index += 1;
  }

  if (index >= len) return;

  index += 1;

  removeWhiteSpace(str, col);

  col.data.push({
    type: "attr",
    value: {
      name: attrName,
      value: attrValue
    }
  });

  // console.log(" final... ", index, col);

  if (index >= str.length) return;

  col.index = index;

  if (str[index] == ">" || str[index] == "/" && str[index + 1] == ">") {
    if (str[index] == "/") {
      col.index += 2;
    } else {
      col.index += 1;
    }

    return;
  } else {
    getAttributes(str, col);
  }
};

var getAttrName = function getAttrName(str, col) {
  var index = col.index,
      len = str.length;
  var attrName = "";

  // console.log(" checking in attrName ", index, str.substr(index, index + 5));
  if (index >= str.length) return;
  while (index < len && str[index] !== "=") {
    attrName += str[index];
    index += 1;
  }

  index += 2;

  col.index = index;

  // console.log(" attrName index in last ", index);

  return attrName;
};

var removeWhiteSpace = function removeSpace(str, col) {
  var index = col.index;

  if (index >= str.length) return;

  while (str[index] === " " || str[index] == "\n") {
    index += 1;
  }

  col.index = index;
};

var skipComments = function comment(str, col) {
  var index = col.index;
  // console.log(" comment found ", col.index, str[index]);
  while (str[index] !== "-" || str[index + 1] !== ">") {
    index += 1;
  }
  // console.log(" comment ended here ", index, str[index], str[index + 1]);
  col.index = index + 2;
};

module.exports = parse;

},{}],3:[function(require,module,exports){
"use strict";

var process = function process(col) {
  //   console.log(' process ', col);
  //   return;

  var evalFunction = {
    str: "let {",
    set: new Set()
  };

  var data = col.data,
      newData = {
    index: 1,
    openTags: []
  };

  var obj = data[0];

  while (data[newData.index].type == "attr") {
    obj.attributes = getElAttribute(data, newData);
  }

  newData.openTags.push(obj.value);
  obj.children = getChildren(data, newData, evalFunction);
  var evalInitializedVariables = evalFunction.set;
  evalFunction = evalFunction.str;
  evalFunction = evalFunction.slice(0, -1);
  evalFunction += "} = data;";
  evalFunction += "return eval(exp);";

  return {
    processedData: obj,
    evalFunction: evalFunction,
    evalInitializedVariables: evalInitializedVariables
  };
};

var getChildren = function getChildren(array, d, evalFunction) {
  var i = d.index,
      children = [],
      oldOpenTags = d.openTags.length,
      len = array.length;

  // console.log("getting children ", oldOpenTags, d, array[d.index]);

  while (d.index < len && (array[d.index] !== "close" || oldOpenTags.length < d.openTags.length)) {
    var el = array[d.index];

    if (el.value == "br") {
      // console.log(" inside while... ", el);
    }

    if (el.tagType == "close") {
      var openTags = d.openTags,
          index = d.index;
      //       console.log(' closing tag ', openTags, index);

      d.openTags.pop();
      d.index += 1;

      //       console.log(' close popped ', d.index);

      break;
    }

    if (el.type == "text") {
      //       console.log(' text text ', el.value);
      processText(el, evalFunction);
      children.push(el);
      d.index += 1;
    } else if (el.type == "tag" && el.tagType == "open") {
      var temp = array[d.index];
      var _openTags = d.openTags;

      d.index += 1;
      temp.attributes = getElAttribute(array, d);
      // if tag is closing or self-closing then don't look for children
      if (array[d.index].tagType == "close") {
        // console.log(" self closing tag found ", array[d.index]);
        temp.children = [];
      } else {
        d.openTags.push(temp.value);
        temp.children = getChildren(array, d, evalFunction);
        var _index = d.index;
      }

      children.push(temp);
    } else if (el.type == "tag" && array[d.index].tagType == "self-closing") {
      var _temp = array[d.index];
      var _openTags2 = d.openTags;

      d.index += 1;
      _temp.attributes = getElAttribute(array, d);

      // if tag is closing or self-closing then don't look for children
      _temp.children = [];
      children.push(_temp);
    }
  }

  d.openTags.pop();

  //   console.log(' returning children.. ', d.index, children);

  return children || [];
};

var processText = function processText(el, evalFunction) {
  // console.log(" processing text ", el);
  var str = el.value,
      found = [],
      rxp = /{{([^}}]+)}}/g,
      curMatch = void 0;

  while (curMatch = rxp.exec(str)) {
    var keys = getVariables(curMatch[1], evalFunction);
    found.push({
      dependsOn: curMatch[1],
      subStr: curMatch[0],
      startsAt: curMatch["index"],
      endsAt: curMatch["index"] + curMatch[0].length - 1,
      keys: keys
    });
  }
  el.dependencies = found;
  // console.log(" text dependdencies ", found);
};

var getVariables = function getVariables(str, evalFunction) {
  var rxp = /[a-zA-z_\.?]+/g,
      variableMatch = void 0,
      updateDependsOn = [];

  while (variableMatch = rxp.exec(str)) {
    // console.log(" match found ", variableMatch);
    var variable = variableMatch[0].split(".")[0];
    updateDependsOn.push(variable);
    if (!evalFunction.set.has(variable)) {
      evalFunction.str += " " + variable + ",";
      evalFunction.set.add(variable);
    }
  }
  return updateDependsOn;
};

var getElAttribute = function getElAttr(array, d) {
  var attributes = [],
      index = d.index;

  //   console.log(' in get attri ', d.index);

  while (array[index].type == "attr") {
    attributes.push(array[index]);
    index += 1;
  }

  //   console.log(' returning attributes ', attributes, index);

  d.index = index;
  return attributes;
};

module.exports = process;

},{}],4:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function makeTree(obj, that) {
  // console.log(" making tree ", that);
  var evalFunction = that.evalFunction,
      el = that.el;

  var tree = getChildTree(obj, that);
  var el2 = el.parentNode;
  // console.log(" dom tree is ", el2, el, tree);
  el2.replaceChild(tree, el);
  obj._dom_node = tree;

  // console.log(" tree is ", obj, el);
}

var getChildTree = function getChildTree(el, that) {
  var nodes = that.nodes,
      nodeCount = that.nodeCount,
      evalFunction = that.evalFunction;

  var node = document.createElement(el.value);
  // console.log(" getting child tree ", el, node);
  node.setAttribute("f-id", "#" + nodeCount);
  that["nodes"]["#" + nodeCount] = node;
  var count = nodeCount;
  that["nodeCount"] += 1;
  setAttributes(node, el.attributes);
  setChildren(node, el, that, count);
  el._dom_node = node;
  return node;
};

var setAttributes = function setAtrributes(node, attributes) {
  if (attributes.length <= 0) return;

  attributes.forEach(function (attribute) {
    node.setAttribute(attribute.value.name, attribute.value.value);
  });
};

var setChildren = function setChildren(node, el, that, count) {
  var data = that.data,
      evalFunction = that.evalFunction;

  // console.log(" set children ", data);

  var children = el.children;
  if (children.length <= 0) return;

  children.forEach(function (child) {
    if (child.type == "text") {
      var value = child.value,
          dependencies = child.dependencies;

      // console.log(
      //   " txt dependencies ============== ",
      //   value,
      //   dependencies,
      //   data,
      //   evalFunction
      // );

      if (dependencies) {
        dependencies.forEach(function (dep) {
          var val = getValueFromObject(data, evalFunction, dep);
          // console.log(" gettting valure for ", dep, val);
          // if expession has only one vriable, and it is updatable then return updated val
          if ((typeof val === "undefined" ? "undefined" : _typeof(val)) === "object" && val instanceof that.updatable) {
            // console.log(" cheking node attibutes ", count);
            val.setRefs(node, el, "#" + count);
            var temp = val;
            val = val.get();
          } else if (dep.keys.length > 0) {
            // if expression has multiple variable and there are updatable variables then add refs to that variable
            dep.keys.forEach(function (key) {
              var updatable = data[key];
              if ((typeof updatable === "undefined" ? "undefined" : _typeof(updatable)) === "object" && updatable instanceof that.updatable) {
                updatable.setRefs(node, el, "#" + count);
              }
            });
          }

          value = value.replace(dep.subStr, val || "");
        });
      }

      var textNode = document.createTextNode(value);
      // console.log(" txt node is ", textNode);

      node.appendChild(textNode);
    } else {
      node.appendChild(getChildTree(child, that));
    }
  });
};

var getValueFromObject = function getValueFromObject(obj, evalFunction, key) {
  try {
    return evalFunction(obj, key.dependsOn);
  } catch (e) {
    console.warn("can not find value for ", key, e);
    return "";
  }
};

module.exports = {
  makeTree: makeTree,
  getChildTree: getChildTree
};

},{}]},{},[1]);
