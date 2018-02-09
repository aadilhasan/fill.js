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
