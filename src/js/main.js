let lifts = [];
let activeRequests = [];

function updateLiftDoorAnimationStatus(liftId) {
  const updatedState = lifts.map((l) =>
    l.liftId == liftId
      ? { ...l, leftDoorAnimation: "running", rightDoorAnimation: "running" }
      : l
  );
  lifts = updatedState;
}

async function openCloseLiftDoor(lift) {
  const door1 = lift.liftElement.childNodes[0];
  const door2 = lift.liftElement.childNodes[1];

  if (
    lift.leftDoorAnimation === "running" ||
    lift.rightDoorAnimation === "running"
  ) {
    // console.log("Animation is already running for this lift. Returning...");
    return;
  }

  updateLiftDoorAnimationStatus(lift.liftId);
  lift.leftDoorAnimation = door1.animate(
    [
      {
        transform: `translateX(0%)`,
      },
      { transform: `translateX(-100%)` },
      { transform: `translateX(0%)` },
    ],
    { duration: 5000 }
  );

  lift.rightDoorAnimation = door2.animate(
    [
      {
        transform: `translateX(0%)`,
      },
      { transform: `translateX(100%)` },
      { transform: `translateX(0%)` },
    ],
    { duration: 5000 }
  );

  await Promise.all([
    lift.leftDoorAnimation.finished,
    lift.rightDoorAnimation.finished,
  ]);
  updateLiftInActiveStaus(lift.liftId);
}

function processActiveRequest() {
  const inActiveLifts = lifts.filter((l) => !l.active);

  if (inActiveLifts.length > 0) {
    const nearestLift = findNearestLift(Number(activeRequests?.[0].to));
    const req = activeRequests.shift();
    if (nearestLift.currentFloor == req.to) {
      // console.log("lift is already at the same floor --->");
      return;
    }

    //check for if theres any active lift going to the floor for activeReq floor
    const activeLiftsForCurrentReq = lifts.filter(
      (l) => l.active && l.movingTo == req.to
    );
    if (activeLiftsForCurrentReq.length > 0) {
      // console.log("active req for the same flooe ---> returning..");
      return;
    }

    updateLiftActiveStatus(nearestLift.liftId, req.to, true);
    moveLift({
      destFloor: req.to,
      liftToMove: nearestLift,
    });
  } else return;
}

function updateLiftActiveStatus(liftId, movingTo, isMoving) {
  const updatedState = lifts.map((l) =>
    l.liftId == liftId
      ? {
          ...l,
          active: true,
          movingTo: movingTo ?? null,
          isMoving: isMoving ?? null,
        }
      : l
  );
  lifts = updatedState;
}

function updateLiftInActiveStaus(liftId) {
  const updatedState = lifts.map((l) =>
    l.liftId == liftId
      ? {
          ...l,
          active: false,
          leftDoorAnimation: "finished",
          rightDoorAnimation: "finished",
        }
      : l
  );
  lifts = updatedState;
}

function updateLiftCurrentFloor(liftId, newFloor) {
  const updatedState = lifts.map((l) =>
    l.liftId == liftId ? { ...l, currentFloor: newFloor, isMoving: false } : l
  );
  lifts = updatedState;
}

function moveLift({ destFloor, liftToMove }) {
  const distanceToMoveInPixel = liftToMove.distance * 130;
  const timeToMove = liftToMove.distance * 2;
  liftToMove.liftElement.style.setProperty(
    "--transitionTime",
    `${timeToMove}s`
    // `${10}s`
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
  const inActiveLifts = lifts.filter((l) => !l.active);
  const liftsWithDistance = inActiveLifts.map((l) => ({
    ...l,
    distance: Math.abs(l.currentFloor - destinationFloor),
  }));
  const nearestLift = liftsWithDistance?.reduce((acc, val) =>
    val.distance < acc.distance ? val : acc
  );

  return Object.keys(nearestLift).length > 0 ? nearestLift : null;
}

function isLiftPresentAtFloor(floornumber) {
  return lifts.filter((l) => l.currentFloor == floornumber && !l.isMoving)
    .length;
}

function getPresentLiftDetails(floornumber) {
  return lifts.find((l) => l.currentFloor == floornumber);
}

async function handleUpLiftClick(event) {
  const { attributes } = event.target;
  const floornumber = attributes.floornumber.value;

  if (isLiftPresentAtFloor(floornumber)) {
    const presentLift = getPresentLiftDetails(floornumber);
    updateLiftActiveStatus(presentLift.liftId);
    await openCloseLiftDoor(presentLift, presentLift.currentFloor);
  } else {
    activeRequests.push({
      to: floornumber,
    });
  }
}

function buildFloorsWithLifts(noOfFloorsToBuild, noOfLiftsToBuild) {
  const container = document.getElementById("simulationContainer");
  container.innerHTML = "";
  lifts = [];
  activeRequests = [];

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
          isMoving: false,
          active: false,
          leftDoorAnimation: null,
          rightDoorAnimation: null,
        });
      }
    }

    container.appendChild(floor);
  }
}

setInterval(() => {
  const inActiveLifts = lifts.filter((l) => !l.active);

  if (activeRequests.length > 0) {
    processActiveRequest();
  }
}, 200);

document.getElementById("createLiftBtn").addEventListener("click", function () {
  const noOfFloors = document.getElementById("noOfFloors").value;
  const noOfLifts = document.getElementById("noOfLifts").value;

  if (Number(noOfLifts) > Number(noOfFloors)) {
    alert(
      `No of lift shouldnt be more than no of floors. Why do we need ${noOfLifts} for ${noOfFloors} floors`
    );
    return;
  }
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
