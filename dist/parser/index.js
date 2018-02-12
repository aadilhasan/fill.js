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

  if (str[index] == "<" && str[index + 1] == "!") {
    skipComments(str, col);
    removeWhiteSpace(str, col);
    getTextFromContent(str, col);
  }

  if (str[index] === "<") {
    col.index += 1;
    let isSelfClosing = getTagName(str, col);
    console.log(" is self closing ", isSelfClosing);

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

const selfClosingTags = [
  "area",
  "base",
  "br",
  "col",
  "command",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
];

const getContent = function content(str, col) {
  console.log(" =========  content ============== ", col);

  if (col.index >= str.length) return;

  getTextFromContent(str, col);

  let index = col.index;
  let content = "";

  console.log(" content ", col);

  if (str[index] == "<") {
    console.log(" calling parse");
    parse(str, col);
    console.log(" returned from parse ", col);
  }
};

const getTextFromContent = function(str, col) {
  let index = col.index;
  let content = "";
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

  let tagType = selfClosingTags.indexOf(tag) !== -1 ? "self-closing" : "open";

  col.data.push({
    type: "tag",
    tagType: tagType,
    value: tag
  });

  console.log(" col is ", col, index);

  getAttributes(str, col);
  console.log(" got attrs ", col, str.substr(col.index, col.index + 5));
  return tagType == "self-closing";
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

const skipComments = function comment(str, col) {
  let index = col.index;
  console.log(" comment found ", col.index, str[index]);
  while (str[index] !== "-" || str[index + 1] !== ">") {
    index += 1;
    console.log(
      " skipping comment ",
      str[index] !== "-" || str[index + 1] !== ">"
    );
  }
  console.log(" comment ended here ", index, str[index], str[index + 1]);
  col.index = index + 2;
};
