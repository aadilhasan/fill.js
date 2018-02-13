let el = document.getElementById("ctnr");

let data = {
  fName: fill.updatable("Dwayne"),
  lName: fill.updatable("Johnnson"),
  testNo: fill.updatable(0),
  fruits: {
    best: "mango",
    good: "banana"
  }
};
fill.init(el, data);

fill.watch("fName", function(newVal, old) {
  console.log(" fName changed ", newVal, old);
});

function updateTest() {
  fill.updateData("testNo", Math.random());
  fill.updateData("lName", "Rock");
}

setTimeout(() => {
  fill.updateData("fName", "The");
  fill.updateData("lName", "B-Rock");
}, 2000);

setTimeout(() => {
  fill.updateData("lName", "Rock");
}, 5000);
