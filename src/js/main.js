let liftPositions = [];

function handleUpLiftClick() {
  console.log("upclick");
  document.getElementById("lift-1").classList.add("moveLiftUp");
  // document.getElementById("lift-1").animate(liftOpenDoor, liftOpenDoorOptions);
}

function handleDownLiftClick() {
  console.log("downclick");
  document.getElementById("lift-1").classList.add("moveLiftDown");
}

function buildFloorsWithLifts(noOfFloorsToBuild, noOfLiftsToBuild) {
  const container = document.getElementById("simulationContainer");
  container.innerHTML = "";

  for (let i = Number(noOfFloorsToBuild); i >= 1; i--) {
    let topFloor = i === Number(noOfFloorsToBuild);
    let groundFloor = i === 1;

    const floor = document.createElement("div");
    floor.setAttribute("class", "floor");
    const buttonContainer = document.createElement("div");
    buttonContainer.setAttribute("class", "buttonContainer");

    const liftContainer = document.createElement("div");
    liftContainer.setAttribute("class", "liftContainer");

    floor.setAttribute("id", `floor-${i}`);
    floor.appendChild(buttonContainer);
    floor.appendChild(liftContainer);
    const floorName = document.createElement("p");
    const upButton = document.createElement("button");
    upButton.addEventListener("click", handleUpLiftClick);
    upButton.textContent = "UP";
    upButton.setAttribute("class", "upBtn");
    const downButton = document.createElement("button");
    downButton.setAttribute("class", "downBtn");
    downButton.addEventListener("click", handleDownLiftClick);
    downButton.textContent = "DOWN";
    floorName.innerText = `floor-${i}`;
    floorName.setAttribute("class", "floorName");
    buttonContainer.appendChild(floorName);

    if (!groundFloor && !topFloor) {
      buttonContainer.appendChild(upButton);
      buttonContainer.appendChild(downButton);
    }
    if (topFloor) buttonContainer.appendChild(downButton);

    // adding lifts on the ground floor initially
    if (groundFloor) {
      for (let i = 1; i <= Number(noOfLiftsToBuild); i++) {
        const lift = document.createElement("div");
        lift.setAttribute("class", "lift");
        lift.setAttribute("id", `lift-${i}`);
        liftContainer.appendChild(lift);
        buttonContainer.appendChild(upButton);
      }
    }

    container.appendChild(floor);
  }
}

document.getElementById("createLiftBtn").addEventListener("click", function () {
  const noOfFloors = document.getElementById("noOfFloors").value;
  const noOfLifts = document.getElementById("noOfLifts").value;
  if (Number(noOfFloors) < 2) {
    alert("Pls add more than one floor");
    return;
  }
  if (Number(noOfLifts) < 1) {
    alert("Pls add at least one lift");
    return;
  }

  buildFloorsWithLifts(noOfFloors, noOfLifts);
});
