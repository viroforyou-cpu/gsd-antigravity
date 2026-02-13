# Graph Visualization Research for GeneReason

## Executive Summary

This document researches and recommends the best graph visualization approach for the GeneReason medical genetics MCQ training application. The application needs to visualize knowledge graphs showing relationships between clinical findings, genetic conditions, genes, mechanisms, and treatments.

## Current Setup

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend Visualization | Reaflow | React library for auto-layout directed graphs |
| Backend Graph Database | FalkorDB | Redis-based graph database with Cypher queries |
| Graph Data | Mock + FalkorDB | Medical genetics knowledge graph |

## Requirements Analysis

### Functional Requirements

1. **Knowledge Graph Display**
   - Nodes: Findings, Conditions, Genes, Mechanisms, Inheritance patterns, Treatments
   - Edges: HAS_FINDING, CAUSED_BY, TREATED_BY, DIAGNOSED_BY, etc.
   - Node types with distinct visual styling

2. **Interactive Features**
   - Zoom and pan
   - Node selection and click events
   - Path highlighting for reasoning
   - Legend and controls

3. **Reasoning Visualization**
   - Association/Graph-based reasoning
   - Hypothetico-deductive paths
   - Constraint satisfaction funnels
   - Argument-based comparisons

### Non-Functional Requirements

1. **Performance**
   - Handle 50-200 nodes efficiently
   - Smooth zoom/pan interactions
   - Fast initial render

2. **Maintainability**
   - Active community and updates
   - Good TypeScript support
   - Clear documentation

3. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - High contrast modes

---

## Frontend Visualization Libraries Comparison

### 1. Reaflow (Current)

**Description**: Modern React library for auto-layout directed graphs using ELK.js

**Pros**:
- Automatic layout (no manual positioning)
- Modern React hooks API
- Good TypeScript support
- Built-in zoom/pan
- Active development

**Cons**:
- Limited customization options
- Smaller community
- Less documentation/examples
- Performance issues with large graphs

**Best For**: Auto-layout directed graphs, flowcharts

**NPM**: ~3,000 weekly downloads

---

### 2. React Flow

**Description**: Highly customizable React library for node-based graphs and editors

**Pros**:
- Very active development (100K+ weekly downloads)
- Excellent documentation and examples
- Custom node/edge types
- Built-in minimap, controls, background
- Great TypeScript support
- Large community
- Addons for advanced features

**Cons**:
- Requires manual or custom layout
- More setup for auto-layout
- Larger bundle size

**Best For**: Interactive graph editors, workflows, custom visualizations

**NPM**: ~100,000 weekly downloads

---

### 3. Cytoscape.js

**Description**: Full-featured graph theory library for visualization and analysis

**Pros**:
- Comprehensive graph algorithms
- Multiple automatic layouts
- Excellent for complex networks
- Good performance
- Extensive styling options
- Analysis capabilities

**Cons**:
- Steeper learning curve
- React wrapper (react-cytoscapejs) less mature
- More imperative API
- Larger bundle size

**Best For**: Complex network analysis, bioinformatics, large graphs

**NPM**: ~40,000 weekly downloads (core), ~3,000 (React wrapper)

---

### 4. D3.js (with d3-force)

**Description**: Low-level data visualization library with force-directed graphs

**Pros**:
- Maximum flexibility
- Best performance for custom needs
- Force-directed layout built-in
- Industry standard

**Cons**:
- Steep learning curve
- More code to write
- Manual SVG handling
- No built-in React integration

**Best For**: Custom, highly-tailored visualizations

**NPM**: ~500,000 weekly downloads

---

### 5. Vis.js (vis-network)

**Description**: Dynamic network visualization library

**Pros**:
- Easy to use
- Good physics simulation
- Timeline visualization available
- Decent performance

**Cons**:
- Less modern API
- Limited React integration
- Smaller community recently

**Best For**: Quick network visualizations, timelines

**NPM**: ~20,000 weekly downloads

---

### 6. Sigma.js

**Description**: High-performance graph rendering for large graphs

**Pros**:
- WebGL rendering (excellent performance)
- Handles 10K+ nodes
- Good for large networks
- Modern architecture

**Cons**:
- Less customization
- WebGL limitations
- Smaller React ecosystem

**Best For**: Large-scale graph visualization

**NPM**: ~8,000 weekly downloads

---

## Backend Graph Database Options

### 1. FalkorDB (Current)

**Description**: Redis-based graph database with Cypher support

**Pros**:
- Fast in-memory operations
- Cypher query language
- Good for real-time queries
- Simple setup

**Cons**:
- Smaller community
- Limited ecosystem
- Persistence requires Redis configuration

---

### 2. Neo4j

**Description**: Industry-leading graph database

**Pros**:
- Largest community
- Comprehensive tooling
- Neo4j Bloom for visualization
- Excellent documentation

**Cons**:
- Heavier setup
- Licensing considerations
- May be overkill for this use case

---

### 3. Graphiti + FalkorDB

**Description**: Temporal knowledge graph framework for AI agents

**Pros**:
- Temporal awareness (tracks changes over time)
- Built for AI/LLM integration
- Semantic search capabilities
- Works with FalkorDB

**Cons**:
- Newer project
- Python backend only
- Learning curve

**Best For**: AI agents, dynamic knowledge graphs, temporal queries

---

## Recommendation

### Primary Recommendation: React Flow

**Rationale**:

1. **Best Fit for Use Case**
   - Medical genetics knowledge graphs are medium-sized (50-200 nodes)
   - Need for custom node types (findings, conditions, genes, etc.)
   - Interactive exploration is key for learning

2. **Technical Advantages**
   - Largest React graph community
   - Excellent TypeScript support
   - Built-in features: minimap, controls, background patterns
   - Custom nodes/edges for different entity types
   - Active maintenance and updates

3. **Implementation Path**
   - Use `dagre` or `elkjs` for automatic layout
   - Create custom node components for each entity type
   - Implement path highlighting for reasoning
   - Add interactive features for learning

### Secondary Recommendation: Add Graphiti to Backend

**Rationale**:

1. **Temporal Knowledge Graphs**
   - Track how understanding evolves during practice
   - Store reasoning history
   - Enable "what did I learn when" queries

2. **AI Integration**
   - Better LLM integration for reasoning generation
   - Semantic search over knowledge graph
   - Continuous learning from user interactions

---

## Implementation Plan

### Phase 1: Replace Reaflow with React Flow

1. Install React Flow and layout dependencies
2. Create custom node components for each entity type
3. Implement automatic layout using dagre/elkjs
4. Add interactive features (selection, highlighting)
5. Update tests

### Phase 2: Integrate Graphiti (Optional)

1. Install Graphiti in backend
2. Create temporal knowledge graph service
3. Add endpoints for temporal queries
4. Update frontend to use new capabilities

---

## Code Example: React Flow Setup

```typescript
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState
} from 'reactflow';
import dagre from 'dagre';

import 'reactflow/dist/style.css';

// Custom node components
import FindingNode from './nodes/FindingNode';
import ConditionNode from './nodes/ConditionNode';
import GeneNode from './nodes/GeneNode';

const nodeTypes = {
  finding: FindingNode,
  condition: ConditionNode,
  gene: GeneNode,
};

// Auto-layout function
function getLayoutedElements(nodes, edges, direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({ rankdir: direction });
  
  nodes.forEach(node => dagreGraph.setNode(node.id, node));
  edges.forEach(edge => dagreGraph.setEdge(edge.source, edge.target));
  
  dagre.layout(dagreGraph);
  
  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x,
        y: nodeWithPosition.y
      }
    };
  });
  
  return { nodes: layoutedNodes, edges };
}

function KnowledgeGraph({ graph }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  useEffect(() => {
    const converted = convertGraphToReactFlow(graph);
    const layouted = getLayoutedElements(converted.nodes, converted.edges);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [graph]);
  
  return (
    <div style={{ height: 500 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

---

## Conclusion

For the GeneReason medical genetics MCQ training application:

1. **Replace Reaflow with React Flow** for frontend visualization
   - Better community support
   - More customization options
   - Built-in interactive features

2. **Consider adding Graphiti** to the backend for temporal knowledge graph capabilities
   - Track learning progress
   - Enable temporal queries
   - Better AI integration

This combination provides a robust, maintainable solution with excellent developer experience and user interaction capabilities.
