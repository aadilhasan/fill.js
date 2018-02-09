function makeTree(obj) {
  console.log(" makking tree.. ", obj);
  let tree = getChildTree(obj);
  console.log(" final tree is ", tree);

  let el = document.getElementById("test");
  el.appendChild(tree);
}

const getChildTree = function childTree(el) {
  let node = document.createElement(el.value);
  setAttributes(node, el.attributes);
  setChildren(node, el.children);

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

const setChildren = function(node, children) {
  if (children.length <= 0) return;

  children.forEach(child => {
    if (child.type == "text") {
      let { value, dependencies } = child;

      console.log(" txt dependencies ", value, dependencies);

      if (dependencies) {
        dependencies.forEach(dep => {
          value = value.replace(dep.subStr, data[dep.dependsOn] || "");
        });
      }

      let textNode = document.createTextNode(value);
      node.appendChild(textNode);
    } else {
      node.appendChild(getChildTree(child));
    }
  });
};
