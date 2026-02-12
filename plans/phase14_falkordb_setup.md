# Phase 14: FalkorDB Graph Database Setup Guide

This guide walks you through setting up FalkorDB for the GeneReason knowledge graph.

## What is FalkorDB?

FalkorDB is a graph database that runs on Redis, providing:
- Property graph model (nodes, edges, properties)
- Cypher-like query language
- High performance for graph traversals
- Easy Docker deployment

## Option 1: Docker Setup (Recommended for Development)

### Step 1: Pull and Run FalkorDB

```bash
# Pull the FalkorDB Docker image
docker pull falkordb/falkordb:latest

# Run FalkorDB
docker run -d \
  --name falkordb \
  -p 6379:6379 \
  falkordb/falkordb:latest
```

### Step 2: Verify FalkorDB is Running

```bash
# Connect using redis-cli
docker exec -it falkordb redis-cli

# In the redis-cli, test graph creation
GRAPH.QUERY genereason_kg "RETURN 1"
```

### Step 3: Configure Backend

Update `backend/.env`:

```env
# FalkorDB Configuration
FALKORDB_HOST=localhost
FALKORDB_PORT=6379
FALKORDB_USERNAME=
FALKORDB_PASSWORD=
FALKORDB_GRAPH_NAME=genereason_kg

# Feature Flags
USE_MOCK_GRAPH=false
```

## Option 2: FalkorDB Cloud (Production)

1. Sign up at [https://www.falkordb.cloud](https://www.falkordb.cloud)
2. Create a new database instance
3. Get your connection details
4. Update environment variables:

```env
FALKORDB_HOST=your-instance.falkordb.cloud
FALKORDB_PORT=6379
FALKORDB_USERNAME=your-username
FALKORDB_PASSWORD=your-password
FALKORDB_GRAPH_NAME=genereason_kg
```

## Step 4: Seed Knowledge Graph Data

The backend will automatically create the graph structure when you run queries. However, you can seed initial data using the API:

```bash
# Create a knowledge graph node
curl -X POST http://localhost:8002/api/v1/graph/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "id": "finding_cherry_red_spot",
    "type": "finding",
    "name": "Cherry-red spot",
    "properties": {
      "description": "Red spot in the macula of the retina"
    }
  }'

# Create another node
curl -X POST http://localhost:8002/api/v1/graph/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "id": "condition_tay_sachs",
    "type": "condition",
    "name": "Tay-Sachs disease",
    "properties": {
      "inheritance": "autosomal recessive",
      "gene": "HEXA"
    }
  }'

# Create an edge between them
curl -X POST http://localhost:8002/api/v1/graph/edges \
  -H "Content-Type: application/json" \
  -d '{
    "id": "edge_tay_sachs_cherry_red",
    "source": "condition_tay_sachs",
    "target": "finding_cherry_red_spot",
    "relationship": "HAS_FINDING",
    "weight": 0.9
  }'
```

## Step 5: Verify Graph Connection

```bash
# Check graph status
curl http://localhost:8002/api/v1/graph/status

# Query the graph
curl -X POST http://localhost:8002/api/v1/graph/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "MATCH (n) RETURN n LIMIT 10"
  }'
```

## Sample Knowledge Graph Data

Here's a script to seed comprehensive medical genetics knowledge:

```python
# scripts/seed_knowledge_graph.py
import httpx

BASE_URL = "http://localhost:8002/api/v1"

# Medical genetics nodes
nodes = [
    # Findings
    {"id": "f_cherry_red_spot", "type": "finding", "name": "Cherry-red spot"},
    {"id": "f_hepatosplenomegaly", "type": "finding", "name": "Hepatosplenomegaly"},
    {"id": "f_developmental_regression", "type": "finding", "name": "Developmental regression"},
    {"id": "f_hypotonia", "type": "finding", "name": "Hypotonia"},
    {"id": "f_seizures", "type": "finding", "name": "Seizures"},
    {"id": "f_failure_to_thrive", "type": "finding", "name": "Failure to thrive"},
    
    # Conditions
    {"id": "c_tay_sachs", "type": "condition", "name": "Tay-Sachs disease"},
    {"id": "c_niemann_pick_a", "type": "condition", "name": "Niemann-Pick type A"},
    {"id": "c_gaucher_1", "type": "condition", "name": "Gaucher disease type 1"},
    {"id": "c_gaucher_2", "type": "condition", "name": "Gaucher disease type 2"},
    {"id": "c_fabry", "type": "condition", "name": "Fabry disease"},
    {"id": "c_krabbe", "type": "condition", "name": "Krabbe disease"},
    
    # Genes
    {"id": "g_hexa", "type": "gene", "name": "HEXA"},
    {"id": "g_smpd1", "type": "gene", "name": "SMPD1"},
    {"id": "g_gba", "type": "gene", "name": "GBA"},
    {"id": "g_gla", "type": "gene", "name": "GLA"},
    {"id": "g_galc", "type": "gene", "name": "GALC"},
    
    # Enzymes
    {"id": "e_hexosaminidase_a", "type": "mechanism", "name": "Hexosaminidase A"},
    {"id": "e_acid_sphingomyelinase", "type": "mechanism", "name": "Acid sphingomyelinase"},
    {"id": "e_glucocerebrosidase", "type": "mechanism", "name": "Glucocerebrosidase"},
    {"id": "e_alpha_galactosidase_a", "type": "mechanism", "name": "Alpha-galactosidase A"},
    
    # Inheritance patterns
    {"id": "i_ar", "type": "inheritance", "name": "Autosomal recessive"},
    {"id": "i_xlr", "type": "inheritance", "name": "X-linked recessive"},
]

# Relationships
edges = [
    # Tay-Sachs relationships
    {"source": "c_tay_sachs", "target": "f_cherry_red_spot", "relationship": "HAS_FINDING", "weight": 0.95},
    {"source": "c_tay_sachs", "target": "f_developmental_regression", "relationship": "HAS_FINDING", "weight": 0.9},
    {"source": "c_tay_sachs", "target": "f_seizures", "relationship": "HAS_FINDING", "weight": 0.7},
    {"source": "c_tay_sachs", "target": "g_hexa", "relationship": "CAUSED_BY", "weight": 1.0},
    {"source": "c_tay_sachs", "target": "e_hexosaminidase_a", "relationship": "ENZYME_DEFICIENCY", "weight": 1.0},
    {"source": "c_tay_sachs", "target": "i_ar", "relationship": "INHERITANCE", "weight": 1.0},
    
    # Niemann-Pick type A relationships
    {"source": "c_niemann_pick_a", "target": "f_cherry_red_spot", "relationship": "HAS_FINDING", "weight": 0.5},
    {"source": "c_niemann_pick_a", "target": "f_hepatosplenomegaly", "relationship": "HAS_FINDING", "weight": 0.95},
    {"source": "c_niemann_pick_a", "target": "f_developmental_regression", "relationship": "HAS_FINDING", "weight": 0.9},
    {"source": "c_niemann_pick_a", "target": "g_smpd1", "relationship": "CAUSED_BY", "weight": 1.0},
    {"source": "c_niemann_pick_a", "target": "e_acid_sphingomyelinase", "relationship": "ENZYME_DEFICIENCY", "weight": 1.0},
    {"source": "c_niemann_pick_a", "target": "i_ar", "relationship": "INHERITANCE", "weight": 1.0},
    
    # Gaucher type 1 relationships
    {"source": "c_gaucher_1", "target": "f_hepatosplenomegaly", "relationship": "HAS_FINDING", "weight": 0.9},
    {"source": "c_gaucher_1", "target": "g_gba", "relationship": "CAUSED_BY", "weight": 1.0},
    {"source": "c_gaucher_1", "target": "e_glucocerebrosidase", "relationship": "ENZYME_DEFICIENCY", "weight": 1.0},
    {"source": "c_gaucher_1", "target": "i_ar", "relationship": "INHERITANCE", "weight": 1.0},
    
    # Fabry relationships
    {"source": "c_fabry", "target": "g_gla", "relationship": "CAUSED_BY", "weight": 1.0},
    {"source": "c_fabry", "target": "e_alpha_galactosidase_a", "relationship": "ENZYME_DEFICIENCY", "weight": 1.0},
    {"source": "c_fabry", "target": "i_xlr", "relationship": "INHERITANCE", "weight": 1.0},
    
    # Gene-Enzyme relationships
    {"source": "g_hexa", "target": "e_hexosaminidase_a", "relationship": "ENCODES", "weight": 1.0},
    {"source": "g_smpd1", "target": "e_acid_sphingomyelinase", "relationship": "ENCODES", "weight": 1.0},
    {"source": "g_gba", "target": "e_glucocerebrosidase", "relationship": "ENCODES", "weight": 1.0},
    {"source": "g_gla", "target": "e_alpha_galactosidase_a", "relationship": "ENCODES", "weight": 1.0},
]

def seed_graph():
    # Create nodes
    for node in nodes:
        response = httpx.post(f"{BASE_URL}/graph/nodes", json=node)
        print(f"Node {node['id']}: {response.status_code}")
    
    # Create edges
    for edge in edges:
        response = httpx.post(f"{BASE_URL}/graph/edges", json=edge)
        print(f"Edge {edge['source']}->{edge['target']}: {response.status_code}")

if __name__ == "__main__":
    seed_graph()
```

## Troubleshooting

### "Connection refused"
- Ensure FalkorDB container is running: `docker ps`
- Check port mapping: `docker port falkordb`
- Verify host/port in `.env` matches Docker configuration

### "Authentication failed"
- If you set a password in Docker, add it to `.env`
- For cloud instances, verify username and password

### "Graph not found"
- The graph is created automatically on first query
- Ensure `FALKORDB_GRAPH_NAME` is set correctly

## Using with Docker Compose

Add to your `docker-compose.yml`:

```yaml
services:
  falkordb:
    image: falkordb/falkordb:latest
    ports:
      - "6379:6379"
    volumes:
      - falkordb_data:/data
    restart: unless-stopped

volumes:
  falkordb_data:
```

Then run:
```bash
docker-compose up -d falkordb
```

## Next Steps

After FalkorDB is configured:
1. Seed the knowledge graph with medical genetics data
2. Test graph queries through the API
3. Verify reasoning paths are generated correctly
4. Configure LLM integration (Phase 15)
