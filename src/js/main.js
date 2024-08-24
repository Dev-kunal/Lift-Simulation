let lifts = [];
const activeRequests = [];

async function openCloseLiftDoor(lift) {
  const door1 = lift.liftElement.childNodes[0];
  const door2 = lift.liftElement.childNodes[1];

  const leftDoorAnimation = door1.animate(
    [
      {
        transform: `translateX(0%)`,
      },
      { transform: `translateX(-100%)` },
      { transform: `translateX(0%)` },
    ],
    { duration: 5000 }
  );

  const rightDoorAnimation = door2.animate(
    [
      {
        transform: `translateX(0%)`,
      },
      { transform: `translateX(100%)` },
      { transform: `translateX(0%)` },
    ],
    { duration: 5000 }
  );

  await Promise.all([leftDoorAnimation.finished, rightDoorAnimation.finished]);
  updateLiftInActiveStaus(lift.liftId);
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

function processActiveRequest() {
  const nearestLift = findNearestLift(activeRequests?.[0].to);
  if (nearestLift) {
    const req = activeRequests.shift();
    const nearestLift = findNearestLift(req.to);
    updateLiftActiveStatus(nearestLift.liftId);
    moveLift({
      destFloor: req.to,
      liftToMove: nearestLift,
    });
  } else return;
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

  if (liftToMove.currentFloor > destFloor) {
    // move down
    // console.log("moving down ----->");
    let currentTop = parseInt(
      window.getComputedStyle(liftToMove.liftElement).top,
      10
    );
    liftToMove.liftElement.style.top = `${
      currentTop + distanceToMoveInPixel
    }px`;
  } else {
    // move up
    // console.log("moving up ----->");
    let currentTop = parseInt(
      window.getComputedStyle(liftToMove.liftElement).top,
      10
    );
    liftToMove.liftElement.style.top = `${
      currentTop - distanceToMoveInPixel
    }px`;
  }

  liftToMove.liftElement.addEventListener("transitionend", async function () {
    updateLiftCurrentFloor(liftToMove.liftId, Number(destFloor));
    await openCloseLiftDoor(liftToMove);
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
  return Object.keys(nearestLift).length > 0 ? nearestLift : null;
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
    // console.log("lift is present at floor->");
    const presentLift = getPresentLiftDetails(floornumber);
    updateLiftActiveStatus(presentLift.liftId);
    await openCloseLiftDoor(presentLift, presentLift.currentFloor);
  } else {
    activeRequests.push({
      to: floornumber,
    });
  }

  // was checking for the nearest lift and was directly moving lift
  // else {
  //   const nearestLift = findNearestLift(floornumber);
  //   if (!nearestLift) {
  //     // console.log("make entry in the Q");
  //     activeRequests.push({
  //       to: floornumber,
  //     });
  //     return;
  //   }
  //   updateLiftActiveStatus(nearestLift.liftId);
  //   moveLift({
  //     destFloor: floornumber,
  //     liftToMove: nearestLift,
  //   });
  // }
}

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
    upButton.addEventListener(
      "click",
      async (event) => await handleUpLiftClick(event)
    );

    const downButton = document.createElement("button");
    downButton.setAttribute("class", "downBtn");
    downButton.setAttribute("floorNumber", `${i}`);
    downButton.setAttribute("direction", "down");
    downButton.addEventListener(
      "click",
      async (event) => await handleUpLiftClick(event)
    );
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

setInterval(() => {
  if (activeRequests.length > 0) {
    processActiveRequest();
  }
}, 200);

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
