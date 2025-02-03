import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const QuadrilateralAnalyzer = () => {
  const GRID_SIZE = 20;
  const TOLERANCE = 1;
  const ANGLE_TOLERANCE = 0.01; // For parallel line detection
  
  const [vertices, setVertices] = useState([
    { x: 100, y: 100 },
    { x: 300, y: 100 },
    { x: 300, y: 300 },
    { x: 100, y: 300 }
  ]);
  const [draggingVertex, setDraggingVertex] = useState(null);
  const [shapeType, setShapeType] = useState('');
  const [properties, setProperties] = useState([]);

  const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  const vectorBetween = (p1, p2) => ({
    x: p2.x - p1.x,
    y: p2.y - p1.y
  });

  const dotProduct = (v1, v2) => v1.x * v2.x + v1.y * v2.y;

  const vectorLength = (v) => Math.sqrt(v.x * v.x + v.y * v.y);

  const normalizeVector = (v) => {
    const len = vectorLength(v);
    return {
      x: v.x / len,
      y: v.y / len
    };
  };

  const isRightAngle = (v1, v2) => {
    const dot = dotProduct(v1, v2);
    return Math.abs(dot) < TOLERANCE;
  };

  const distance = (p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const areEqual = (a, b) => Math.abs(a - b) < TOLERANCE;

  const areParallel = (p1, p2, p3, p4) => {
    const v1 = vectorBetween(p1, p2);
    const v2 = vectorBetween(p3, p4);
    
    // Normalize vectors to unit length
    const n1 = normalizeVector(v1);
    const n2 = normalizeVector(v2);
    
    // Parallel vectors will have a dot product of 1 or -1
    const dot = Math.abs(dotProduct(n1, n2));
    return Math.abs(1 - dot) < ANGLE_TOLERANCE;
  };

  const isKite = (sides) => {
    // A kite has two pairs of adjacent equal sides
    // Check both possible configurations:
    const config1 = areEqual(sides[0], sides[1]) && areEqual(sides[2], sides[3]);
    const config2 = areEqual(sides[1], sides[2]) && areEqual(sides[3], sides[0]);
    return config1 || config2;
  };

  const analyzeShape = () => {
    const sides = [
      distance(vertices[0], vertices[1]),
      distance(vertices[1], vertices[2]),
      distance(vertices[2], vertices[3]),
      distance(vertices[3], vertices[0])
    ];

    const vectors = [
      vectorBetween(vertices[0], vertices[1]),
      vectorBetween(vertices[1], vertices[2]),
      vectorBetween(vertices[2], vertices[3]),
      vectorBetween(vertices[3], vertices[0])
    ];

    const rightAngles = [
      isRightAngle(vectors[3], vectors[0]),
      isRightAngle(vectors[0], vectors[1]),
      isRightAngle(vectors[1], vectors[2]),
      isRightAngle(vectors[2], vectors[3])
    ];

    const allRightAngles = rightAngles.every(isRight => isRight);
    const allSidesEqual = sides.every(side => areEqual(side, sides[0]));
    
    // Check for parallel sides using normalized vectors
    const parallel1 = areParallel(vertices[0], vertices[1], vertices[2], vertices[3]);
    const parallel2 = areParallel(vertices[1], vertices[2], vertices[3], vertices[0]);
    
    const oppositeSidesEqual = 
      areEqual(sides[0], sides[2]) && 
      areEqual(sides[1], sides[3]);

    const props = [];

    // Determine shape type with strict hierarchy
    if (allSidesEqual && allRightAngles) {
      setShapeType('Square');
      props.push('All sides equal', 'All angles 90°');
    } else if (allRightAngles && parallel1 && parallel2) {
      setShapeType('Rectangle');
      props.push('Opposite sides equal', 'All angles 90°');
    } else if (allSidesEqual && parallel1 && parallel2) {
      setShapeType('Rhombus');
      props.push('All sides equal', 'Opposite angles equal');
    } else if (parallel1 && parallel2 && oppositeSidesEqual) {
      setShapeType('Parallelogram');
      props.push('Opposite sides parallel and equal');
    } else if (parallel1 || parallel2) {
      setShapeType('Trapezium');
      props.push('One pair of parallel sides');
    } else if (isKite(sides)) {
      setShapeType('Kite');
      if (areEqual(sides[0], sides[1]) && areEqual(sides[2], sides[3])) {
        props.push('First two sides equal', 'Last two sides equal');
      } else {
        props.push('Second two sides equal', 'Last and first sides equal');
      }
    } else {
      setShapeType('General Quadrilateral');
      props.push('No special properties');
    }
    setProperties(props);
  };

  // Rest of the component remains the same...
  
  const handleMouseDown = (index) => {
    setDraggingVertex(index);
  };

  const handleMouseMove = (e) => {
    if (draggingVertex === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = snapToGrid(e.clientX - rect.left);
    const y = snapToGrid(e.clientY - rect.top);

    setVertices(prev => prev.map((vertex, i) => 
      i === draggingVertex ? { x, y } : vertex
    ));
  };

  const handleMouseUp = () => {
    setDraggingVertex(null);
  };

  const createGridLines = () => {
    const lines = [];
    const width = 400;
    const height = 400;

    for (let x = 0; x <= width; x += GRID_SIZE) {
      lines.push(
        <line
          key={`v${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      );
    }

    for (let y = 0; y <= height; y += GRID_SIZE) {
      lines.push(
        <line
          key={`h${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      );
    }

    return lines;
  };

  useEffect(() => {
    analyzeShape();
  }, [vertices]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Quadrilateral Analyzer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div 
            className="relative w-full h-96 bg-white rounded-lg cursor-pointer overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <svg className="w-full h-full">
              {createGridLines()}
              
              <path
                d={`M ${vertices.map(v => `${v.x},${v.y}`).join(' L ')} Z`}
                fill="rgba(59, 130, 246, 0.2)"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              
              {vertices.map((vertex, i) => (
                <circle
                  key={i}
                  cx={vertex.x}
                  cy={vertex.y}
                  r="6"
                  fill={draggingVertex === i ? "#2563eb" : "#3b82f6"}
                  onMouseDown={() => handleMouseDown(i)}
                  className="cursor-move"
                />
              ))}
            </svg>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-blue-600">{shapeType}</h3>
            <ul className="list-disc list-inside space-y-1">
              {properties.map((prop, i) => (
                <li key={i} className="text-gray-700">{prop}</li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-gray-500">
            Drag the blue circles to reshape the quadrilateral. Vertices will snap to the grid for precise shapes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuadrilateralAnalyzer;
