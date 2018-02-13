function makeTree(obj, that) {
  // console.log(" making tree ", that);
  let { evalFunction, el } = that;
  let tree = getChildTree(obj, that);
  let el2 = el.parentNode;
  // console.log(" dom tree is ", el2, el, tree);
  el2.replaceChild(tree, el);
  obj._dom_node = tree;

  // console.log(" tree is ", obj, el);
}

const getChildTree = function(el, that) {
  let { nodes, nodeCount, evalFunction } = that;
  let node = document.createElement(el.value);
  // console.log(" getting child tree ", el, node);
  node.setAttribute("f-id", "#" + nodeCount);
  that["nodes"]["#" + nodeCount] = node;
  let count = nodeCount;
  that["nodeCount"] += 1;
  setAttributes(node, el.attributes);
  setChildren(node, el, that, count);
  el._dom_node = node;
  return node;
};

const setAttributes = function setAtrributes(node, attributes) {
  if (attributes.length <= 0) return;

  attributes.forEach(attribute => {
    node.setAttribute(attribute.value.name, attribute.value.value);
  });
};

const setChildren = function(node, el, that, count) {
  let { data, evalFunction } = that;

  // console.log(" set children ", data);

  let children = el.children;
  if (children.length <= 0) return;

  children.forEach(child => {
    if (child.type == "text") {
      let { value, dependencies } = child;

      // console.log(
      //   " txt dependencies ============== ",
      //   value,
      //   dependencies,
      //   data,
      //   evalFunction
      // );

      if (dependencies) {
        dependencies.forEach(dep => {
          let val = getValueFromObject(data, evalFunction, dep);
          // console.log(" gettting valure for ", dep, val);
          // if expession has only one vriable, and it is updatable then return updated val
          if (typeof val === "object" && val instanceof updatableData) {
            // console.log(" cheking node attibutes ", count);
            val.setRefs(node, el, "#" + count);
            let temp = val;
            val = val.get();
          } else if (dep.keys.length > 0) {
            // if expression has multiple variable and there are updatable variables then add refs to that variable
            dep.keys.forEach(key => {
              let updatable = data[key];
              if (
                typeof updatable === "object" &&
                updatable instanceof updatableData
              ) {
                updatable.setRefs(node, el, "#" + count);
              }
            });
          }

          value = value.replace(dep.subStr, val || "");
        });
      }

      let textNode = document.createTextNode(value);
      // console.log(" txt node is ", textNode);

      node.appendChild(textNode);
    } else {
      node.appendChild(getChildTree(child, that));
    }
  });
};

const getValueFromObject = function(obj, evalFunction, key) {
  try {
    return evalFunction(obj, key.dependsOn);
  } catch (e) {
    console.warn("can not find value for ", key, e);
    return "";
  }
};
