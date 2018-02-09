let el = document.getElementById("ctnr");

const col = {
  data: [],
  index: 0
};

const data = {
  fName: "aadil",
  lName: "hasan"
};

console.log(" this is app.js ", el);

let parsed = parse(el.outerHTML, col);

console.log(" parsed data ", parsed);

let nestedEls = process(parsed);

makeTree(nestedEls);
