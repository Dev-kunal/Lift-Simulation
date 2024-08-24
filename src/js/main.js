let lifts = [];
const activeRequests = [];

function openCloseLiftDoor(lift) {
  const door1 = lift.liftElement.childNodes[0];
  const door2 = lift.liftElement.childNodes[1];

  door2.addEventListener("animationend", function () {
    door1.style.animation = "none";
    door2.style.animation = "none";
    updateLiftInActiveStaus(lift.liftId);
  });

  door1.style.animation = "openCloseDoor 5s 1";
  door2.style.animation = "openCloseDoor 5s 1";
}

function openDoor(lift) {
  lift.liftElement.childNodes[0].style.width = `0%`;
  lift.liftElement.childNodes[1].style.width = `0%`;
  return new Promise((resolve) => {
    lift.liftElement.childNodes[0].addEventListener(
      "transitionend",
      function () {
        lift.liftElement.childNodes[0].style.width = `100%`;
        lift.liftElement.childNodes[1].style.width = `100%`;

        resolve();
      }
    );
  });
}

function closeDoor(lift) {
  return new Promise((resolve) => {
    lift.liftElement.childNodes[0].style.width = `100%`;
    lift.liftElement.childNodes[1].style.width = `100%`;

    lift.liftElement.childNodes[0].addEventListener(
      "transitionend",
      function () {
        resolve();
      }
    );
  });
}

function updateLiftActiveStatus(liftId) {
  const updatedState = lifts.map((l) =>
    l.liftId == liftId ? { ...l, active: true } : l
  );
  lifts = updatedState;
}

function updateLiftInActiveStaus(liftId) {
  const updatedState = lifts.map((l) =>
    l.liftId == liftId ? { ...l, active: false } : l
  );
  lifts = updatedState;
  console.log("updated the active status");
}

function updateLiftCurrentFloor(liftId, newFloor) {
  const updatedState = lifts.map((l) =>
    l.liftId == liftId ? { ...l, currentFloor: newFloor } : l
  );
  lifts = updatedState;
}

function moveLift({ destFloor, liftToMove }) {
  const distanceToMoveInPixel = liftToMove.distance * 132;
  const timeToMove = liftToMove.distance * 2;
  liftToMove.liftElement.style.setProperty(
    "--transitionTime",
    `${timeToMove}s`
  );

  updateLiftActiveStatus(liftToMove.liftId);
  if (liftToMove.currentFloor > destFloor) {
    // move down
    console.log("moving down ----->");
    let currentTop = parseInt(
      window.getComputedStyle(liftToMove.liftElement).top,
      10
    );
    liftToMove.liftElement.style.top = `${
      currentTop + distanceToMoveInPixel
    }px`;
  } else {
    // move up
    console.log("moving up ----->");
    let currentTop = parseInt(
      window.getComputedStyle(liftToMove.liftElement).top,
      10
    );
    liftToMove.liftElement.style.top = `${
      currentTop - distanceToMoveInPixel
    }px`;
  }

  liftToMove.liftElement.addEventListener("transitionend", async function () {
    openCloseLiftDoor(liftToMove);
    updateLiftCurrentFloor(liftToMove.liftId, Number(destFloor));
  });
}

function findNearestLift(destinationFloor) {
  const nearestLift = lifts
    .filter((l) => !l.active)
    .map((l) => ({
      ...l,
      distance: Math.abs(l.currentFloor - destinationFloor),
    }))
    .reduce((acc, val) => (acc.distance < val.distance ? acc : val), {});
  return nearestLift;
}

function isLiftPresentAtFloor(floornumber) {
  return lifts.filter((l) => l.currentFloor == floornumber).length;
}

function getPresentLiftDetails(floornumber) {
  return lifts.find((l) => l.currentFloor == floornumber);
}

async function handleUpLiftClick(event) {
  const { attributes } = event.target;
  const floornumber = attributes.floornumber.value;

  if (isLiftPresentAtFloor(floornumber)) {
    // console.log("lift is already at the floor");
    const presentLift = getPresentLiftDetails(floornumber);
    openCloseLiftDoor(presentLift);
  } else {
    const nearestLift = findNearestLift(floornumber);
    moveLift({
      destFloor: floornumber,
      liftToMove: nearestLift,
    });
  }
}

// function handleDownLiftClick(event) {
//   const { attributes } = event.target;
//   const floornumber = attributes.floornumber.value;

//   if (lifts.filter((l) => l.currentFloor == floornumber).length) {
//     console.log(
//       "lift is already at the floor"
//     );
//     const presentLift = getPresentLiftDetails(floornumber);
//     openLiftDoor(presentLift);
//     closeLiftDoor(presentLift);
//   } else {
//     const nearestLift = findNearestLift(floornumber);
//     moveLift({
//       destFloor: floornumber,
//       liftToMove: nearestLift,
//     });
//   }
// }

function buildFloorsWithLifts(noOfFloorsToBuild, noOfLiftsToBuild) {
  const container = document.getElementById("simulationContainer");
  container.innerHTML = "";
  lifts = [];

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
    upButton.textContent = "UP";
    upButton.setAttribute("class", "upBtn");
    upButton.setAttribute("floorNumber", `${i}`);
    upButton.setAttribute("direction", "up");
    upButton.addEventListener("click", handleUpLiftClick);

    const downButton = document.createElement("button");
    downButton.setAttribute("class", "downBtn");
    downButton.setAttribute("floorNumber", `${i}`);
    downButton.setAttribute("direction", "down");
    downButton.addEventListener("click", handleUpLiftClick);
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
        const liftDoorLeft = document.createElement("div");
        const liftDoorRight = document.createElement("div");
        liftDoorLeft.setAttribute("class", "door");
        liftDoorRight.setAttribute("class", "door");
        lift.append(liftDoorLeft, liftDoorRight);
        lift.setAttribute("class", "lift");
        lift.setAttribute("id", `lift-${i}`);
        liftContainer.appendChild(lift);
        buttonContainer.appendChild(upButton);
        lifts.push({
          liftElement: lift,
          liftId: i,
          currentFloor: 1,
          active: false,
        });
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
