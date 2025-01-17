// Function to load and parse DXF files
function loadDXFFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      // Parse the DXF content
      const parser = new DxfParser();
      const dxfData = parser.parseSync(e.target.result);

      if (!dxfData || !dxfData.entities) {
        throw new Error('Invalid DXF data.');
      }

      // Get the drawing extents to set canvas size
      const extents = getDxfExtents(dxfData);
      if (!extents) {
        alert('Failed to determine DXF extents.');
        return;
      }

      const drawingWidth = extents.maxX - extents.minX;
      const drawingHeight = extents.maxY - extents.minY;

      // Resize canvas to viewport size
      resizeCanvas();

      // Calculate scale to fit drawing into canvas
      const canvasWidth = floorCanvas.width;
      const canvasHeight = floorCanvas.height;

      const scaleX = canvasWidth / drawingWidth;
      const scaleY = canvasHeight / drawingHeight;
      scale = Math.min(scaleX, scaleY);

      // Center the drawing
      panOffset.x = -extents.minX * scale + (canvasWidth - drawingWidth * scale) / 2;
      panOffset.y = -extents.minY * scale + (canvasHeight - drawingHeight * scale) / 2;

      // Extract line segments from DXF entities
      originalFloorPlanLines = extractLinesFromDXF(dxfData.entities);
      floorPlanLines = originalFloorPlanLines.map(line => ({...line}));
      floorPlanBounds = getFloorPlanBounds();
      isFloorPlanLoaded = true;
      drawCanvas();
    } catch (error) {
      alert('Failed to parse DXF file. See console for details.');
      throw error;
    }
  };
  reader.readAsText(file);
}

// Function to extract line segments from DXF entities
function extractLinesFromDXF(entities) {
  let lines = [];

  entities.forEach(entity => {
    switch (entity.type) {
      case 'LINE':
        lines.push({
          x1: Math.round(entity.vertices[0].x),
          y1: Math.round(entity.vertices[0].y),
          x2: Math.round(entity.vertices[1].x),
          y2: Math.round(entity.vertices[1].y)
        });
        break;
      case 'LWPOLYLINE':
      case 'POLYLINE':
        let vertices = entity.vertices;
        for (let i = 0; i < vertices.length - 1; i++) {
          lines.push({
            x1: Math.round(vertices[i].x),
            y1: Math.round(vertices[i].y),
            x2: Math.round(vertices[i + 1].x),
            y2: Math.round(vertices[i + 1].y)
          });
        }
        // If the polyline is closed, add segment between last and first vertex
        if (entity.closed || entity.shape) {
          lines.push({
            x1: Math.round(vertices[vertices.length - 1].x),
            y1: Math.round(vertices[vertices.length - 1].y),
            x2: Math.round(vertices[0].x),
            y2: Math.round(vertices[0].y)
          });
        }
        break;
        // Add cases for other DXF entities if needed
    }
  });

  return lines;
}

// Function to get extents from DXF data
function getDxfExtents(dxf) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  dxf.entities.forEach(entity => {
    const bbox = getEntityBoundingBox(entity);
    if (bbox) {
      minX = Math.min(minX, bbox.minX);
      minY = Math.min(minY, bbox.minY);
      maxX = Math.max(maxX, bbox.maxX);
      maxY = Math.max(maxY, bbox.maxY);
    }
  });

  if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
    console.error('No valid entities found to calculate extents.');
    return null;
  }

  return {minX, minY, maxX, maxY};
}

// Function to get bounding box of a DXF entity
function getEntityBoundingBox(entity) {
  switch (entity.type) {
    case 'LINE':
      const xs = [entity.vertices[0].x, entity.vertices[1].x];
      const ys = [entity.vertices[0].y, entity.vertices[1].y];
      return {
        minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys)
      };
    case 'POLYLINE':
    case 'LWPOLYLINE':
      if (entity.vertices && entity.vertices.length > 0) {
        const xs = entity.vertices.map(v => v.x);
        const ys = entity.vertices.map(v => v.y);
        return {
          minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys)
        };
      }
      break;
      // Add cases for other DXF entities if needed
    default:
      return null;
  }
  return null;
}