const process = function process(col) {
  //   console.log(' process ', col);
  //   return;

  let evalFunction = {
    str: "let {",
    set: new Set()
  };

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
  obj.children = getChildren(data, newData, evalFunction);
  let evalInitializedVariables = evalFunction.set;
  evalFunction = evalFunction.str;
  evalFunction = evalFunction.slice(0, -1);
  evalFunction += "} = data;";
  evalFunction += "return eval(exp);";

  return {
    processedData: obj,
    evalFunction,
    evalInitializedVariables
  };
};

const getChildren = function getChildren(array, d, evalFunction) {
  let i = d.index,
    children = [],
    oldOpenTags = d.openTags.length,
    len = array.length;

  // console.log("getting children ", oldOpenTags, d, array[d.index]);

  while (
    d.index < len &&
    (array[d.index] !== "close" || oldOpenTags.length < d.openTags.length)
  ) {
    let el = array[d.index];

    if (el.value == "br") {
      // console.log(" inside while... ", el);
    }

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
      processText(el, evalFunction);
      children.push(el);
      d.index += 1;
    } else if (el.type == "tag" && el.tagType == "open") {
      let temp = array[d.index];
      let openTags = d.openTags;

      d.index += 1;
      temp.attributes = getElAttribute(array, d);
      // if tag is closing or self-closing then don't look for children
      if (array[d.index].tagType == "close") {
        // console.log(" self closing tag found ", array[d.index]);
        temp.children = [];
      } else {
        d.openTags.push(temp.value);
        temp.children = getChildren(array, d, evalFunction);
        let index = d.index;
      }

      children.push(temp);
    } else if (el.type == "tag" && array[d.index].tagType == "self-closing") {
      let temp = array[d.index];
      let openTags = d.openTags;

      d.index += 1;
      temp.attributes = getElAttribute(array, d);

      // if tag is closing or self-closing then don't look for children
      temp.children = [];
      children.push(temp);
    }
  }

  d.openTags.pop();

  //   console.log(' returning children.. ', d.index, children);

  return children || [];
};

const processText = function(el, evalFunction) {
  // console.log(" processing text ", el);
  let str = el.value,
    found = [],
    rxp = /{{([^}}]+)}}/g,
    curMatch;

  while ((curMatch = rxp.exec(str))) {
    let keys = getVariables(curMatch[1], evalFunction);
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

const getVariables = function(str, evalFunction) {
  let rxp = /[a-zA-z_\.?]+/g,
    variableMatch,
    updateDependsOn = [];

  while ((variableMatch = rxp.exec(str))) {
    // console.log(" match found ", variableMatch);
    let variable = variableMatch[0].split(".")[0];
    updateDependsOn.push(variable);
    if (!evalFunction.set.has(variable)) {
      evalFunction.str += " " + variable + ",";
      evalFunction.set.add(variable);
    }
  }
  return updateDependsOn;
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
