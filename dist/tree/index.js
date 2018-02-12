function makeTree(obj, data, root) {
  let tree = getChildTree(obj, data);
  let el = root.parentNode;
  // console.log(" made tree ", el, root, tree);
  el.replaceChild(tree, root);
  obj._dom_node = tree;

  console.log(" tree is ", obj, el);
}

const getChildTree = function childTree(el, data) {
  console.log(" getting child tree ", data, this);
  let node = document.createElement(el.value);
  setAttributes(node, el.attributes);
  setChildren(node, el, data);
  el._dom_node = node;
  return node;
};

const setAttributes = function setAtrributes(node, attributes) {
  if (attributes.length <= 0) return;

  attributes.forEach(attribute => {
    node.setAttribute(attribute.value.name, attribute.value.value);
  });
};

// const setChildren = function(node, children) {
//   if (children.length <= 0) return;

//   children.forEach(child => {
//     if (child.type == "text") {
//       let textNode = document.createTextNode(child.value);
//       node.appendChild(textNode);
//     } else {
//       node.appendChild(getChildTree(child));
//     }
//   });
// };

const setChildren = function(node, el, data) {
  let children = el.children;
  if (children.length <= 0) return;

  children.forEach(child => {
    if (child.type == "text") {
      let { value, dependencies } = child;

      console.log(" txt dependencies ", value, dependencies, data);

      if (dependencies) {
        dependencies.forEach(dep => {
          let val = data[dep.dependsOn];
          if (typeof val === "object" && val instanceof updatableData) {
            val.setRefs(node, el);
            let temp = val;
            val = val.get();
          }

          value = value.replace(dep.subStr, val || "");
        });
      }

      let textNode = document.createTextNode(value);
      console.log(" txt node is ", textNode);

      node.appendChild(textNode);
    } else {
      node.appendChild(getChildTree(child, data));
    }
  });
};
