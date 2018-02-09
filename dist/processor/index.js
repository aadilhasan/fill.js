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
      processText(el);
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

const processText = function(el) {
  console.log(" processing text ", el);
  let str = el.value,
    found = [],
    rxp = /{{([^}}]+)}}/g,
    curMatch;

  while ((curMatch = rxp.exec(str))) {
    found.push({
      dependsOn: curMatch[1],
      subStr: curMatch[0],
      startsAt: curMatch["index"],
      endsAt: curMatch["index"] + curMatch[0].length - 1
    });
  }

  el.dependencies = found;
  console.log(" text dependdencies ", found);
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
