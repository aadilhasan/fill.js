let el = document.getElementById("ctnr");

let data = {
  fName: fill.updatable("Dwayne"),
  lName: "Johnnson",
  testNo: fill.updatable(0)
};
fill.init(el, data);

fill.watch("fName", function(newVal, old) {
  console.log(" fName changed ", newVal, old);
});

function updateTest() {
  fill.updateData("testNo", Math.random());
}

setTimeout(() => {
  fill.updateData("fName", "The");
  // fill.updateData("lName", "Rock");
}, 2000);

setTimeout(() => {
  fill.updateData("fName", "Rock");
}, 5000);
