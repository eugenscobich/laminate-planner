// **Function to get floor plan bounds**
function getFloorPlanBounds() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  floorPlanLines.forEach(line => {
    minX = Math.min(minX, line.x1, line.x2);
    minY = Math.min(minY, line.y1, line.y2);
    maxX = Math.max(maxX, line.x1, line.x2);
    maxY = Math.max(maxY, line.y1, line.y2);
  });
  return {minX, minY, maxX, maxY};
}

function getCornerPoints() {
  let cornerPoints = [];
  cornerPoints.push({x: floorPlanBounds.minX, y: floorPlanBounds.minY});
  cornerPoints.push({x: floorPlanBounds.minX, y: floorPlanBounds.maxY});
  cornerPoints.push({x: floorPlanBounds.maxX, y: floorPlanBounds.minY});
  cornerPoints.push({x: floorPlanBounds.maxX, y: floorPlanBounds.maxY});
  return cornerPoints;
}

// Function to compute the intersection point between two line segments
function getLineIntersection(seg1, seg2) {
  const x1 = seg1.x1, y1 = seg1.y1, x2 = seg1.x2, y2 = seg1.y2;
  const x3 = seg2.x1, y3 = seg2.y1, x4 = seg2.x2, y4 = seg2.y2;

  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) {
    // Lines are parallel or coincident
    return null;
  }

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  // Check if the intersection point is on both line segments
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    const x = x1 + ua * (x2 - x1);
    const y = y1 + ua * (y2 - y1);
    return {x, y};
  }

  return null; // Intersection point is not on both segments
}

function rotatePoint(x, y, cx, cy, angleRad) {
  // Translate point so center is (0,0)
  const tx = x - cx;
  const ty = y - cy;
  // Apply rotation
  const rx = tx * Math.cos(angleRad) - ty * Math.sin(angleRad);
  const ry = tx * Math.sin(angleRad) + ty * Math.cos(angleRad);
  // Translate back
  return {
    x: rx + cx,
    y: ry + cy
  };
}