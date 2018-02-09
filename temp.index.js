let el = document.getElementById("ctnr");
// console.log(el.innerHTML);

const col = {
  data: [],
  index: 0
};

const parse = function parse(str, col) {
  console.log(" =========  parse ========= ", col, str.length);
  removeWhiteSpace(str, col);
  let index = col.index;

  if (index >= str.length) return;

  if (str[index] == "<" && str[index + 1] == "/") {
    col.index += 2;
    getClosingTagName(str, col);
    return;
  }

  if (str[index] === "<") {
    col.index += 1;
    getTagName(str, col);
    getContent(str, col);

    if (col.index < str.length) {
      parse(str, col);
    }
  }

  return col;
};

const getContent = function content(str, col) {
  console.log(" =========  content ============== ", col);

  let index = col.index;
  let content = "";

  if (index >= str.length) return;

  while (str[index] !== "<") {
    content += str[index];
    index += 1;
    console.log(str[index]);
  }

  col.index = index;

  col.data.push({
    type: "text",
    value: content
  });

  console.log(" content ", col);

  if (str[index] == "<") {
    console.log(" calling parse");
    parse(str, col);
    console.log(" returned from parse ", col);
  }
};

const getTagName = function tagName(str, col) {
  console.log(" =========  tag name ============== ", col);

  let index = col.index;
  let tag = "";

  if (index >= str.length) return;

  while (str[index] !== " " && str[index] !== ">") {
    tag += str[index];
    index += 1;
  }

  col.index = index;

  col.data.push({
    type: "tag",
    tagType: "open",
    value: tag
  });

  console.log(" col is ", col, index);

  getAttributes(str, col);
  console.log(" got attrs ", col, str.substr(col.index, col.index + 5));
};

const getClosingTagName = function(str, col) {
  let index = col.index;
  let tag = "";

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

const getAttributes = function attributes(str, col) {
  removeWhiteSpace(str, col);

  if (str[col.index] == ">") {
    col.index += 1;
    return;
  }

  let attrValue = "";
  let attrName = getAttrName(str, col);
  let index = col.index,
    len = str.length;

  if (index >= str.length) return;
  console.log(" item ", str[index], index);

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

  console.log(" final... ", index, col);

  if (index >= str.length) return;

  col.index = index;

  if (str[index] == ">" || (str[index] == "/" && str[index + 1] == ">")) {
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

const getAttrName = function(str, col) {
  let index = col.index,
    len = str.length;
  let attrName = "";

  console.log(" checking in attrName ", index, str.substr(index, index + 5));
  if (index >= str.length) return;
  while (index < len && str[index] !== "=") {
    attrName += str[index];
    index += 1;
  }

  index += 2;

  col.index = index;

  console.log(" attrName index in last ", index);

  return attrName;
};

const removeWhiteSpace = function removeSpace(str, col) {
  let index = col.index;

  if (index >= str.length) return;

  while (str[index] === " " || str[index] == "\n") {
    index += 1;
  }

  col.index = index;
};

let parsed = parse(el.outerHTML, col);

const process = function process(col) {
  //   console.log(' process ', col);
  //   return;

  let data = col.data,
    newData = {
      index: 1,
      openTags: []
    };

  let obj = data[0];

  while (data[newData.index].type == "attr") {
    obj.attributes = getElAttribute(data, newData);
  }

  newData.openTags.push(obj.value);
  obj.children = getChildren(data, newData);

  return obj;
};

const getChildren = function getChildren(array, d) {
  let i = d.index,
    children = [],
    oldOpenTags = d.openTags.length,
    len = array.length;

  //   console.log('getting children ', oldOpenTags, d, array[d.index]);

  while (
    d.index < len &&
    (array[d.index] !== "close" || oldOpenTags.length < d.openTags.length)
  ) {
    let el = array[d.index];

    //     console.log(' inside while... ', el, d);

    if (el.tagType == "close") {
      let { openTags, index } = d;
      //       console.log(' closing tag ', openTags, index);

      d.openTags.pop();
      d.index += 1;

      //       console.log(' close popped ', d.index);

      break;
    }

    if (el.type == "text") {
      //       console.log(' text text ', el.value);

      children.push(el);
      d.index += 1;
    } else if (el.type == "tag" && el.tagType == "open") {
      let temp = array[d.index];
      let openTags = d.openTags;

      d.index += 1;

      temp.attributes = getElAttribute(array, d);

      //       console.log(' found open tag.. ', temp, openTags, array[d.index]);

      if (array[d.index].tagType == "close") {
        temp.children = [];
      } else {
        d.openTags.push(temp.value);

        temp.children = getChildren(array, d);
        let index = d.index;

        //         console.log('got children.. ', temp, array[d.index], index);
      }

      children.push(temp);
    }
  }

  d.openTags.pop();

  //   console.log(' returning children.. ', d.index, children);

  return children || [];
};

const getText = function(array, d) {
  let textChild = [],
    index = d.index;
  while (array[index].type == "text") {
    textChild.push(array[index]);
    index += 1;
  }

  d.index = index;
  return textChild;
};

const getElAttribute = function getElAttr(array, d) {
  let attributes = [],
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

const setChildren = function(node, children) {
  if (children.length <= 0) return;

  children.forEach(child => {
    if (child.type == "text") {
      let textNode = document.createTextNode(child.value);
      node.appendChild(textNode);
    } else {
      node.appendChild(getChildTree(child));
    }
  });
};

let nestedEls = process(parsed);

makeTree(nestedEls);
