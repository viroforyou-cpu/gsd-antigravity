#!/usr/bin/env python3
"""
Seed script for the GeneReason knowledge graph.
Populates FalkorDB with medical genetics nodes and relationships.
"""
import httpx
import sys

BASE_URL = "http://localhost:8002/api/v1"

# Medical genetics nodes
nodes = [
    # Findings
    {"id": "f_cherry_red_spot", "type": "finding", "name": "Cherry-red spot", "properties": {"description": "Red spot in the macula of the retina"}},
    {"id": "f_hepatosplenomegaly", "type": "finding", "name": "Hepatosplenomegaly", "properties": {"description": "Enlargement of liver and spleen"}},
    {"id": "f_developmental_regression", "type": "finding", "name": "Developmental regression", "properties": {"description": "Loss of previously acquired developmental milestones"}},
    {"id": "f_hypotonia", "type": "finding", "name": "Hypotonia", "properties": {"description": "Decreased muscle tone"}},
    {"id": "f_seizures", "type": "finding", "name": "Seizures", "properties": {"description": "Abnormal electrical activity in the brain"}},
    {"id": "f_failure_to_thrive", "type": "finding", "name": "Failure to thrive", "properties": {"description": "Poor growth and weight gain"}},
    {"id": "f_startle_response", "type": "finding", "name": "Exaggerated startle response", "properties": {"description": "Abnormal sensitivity to sudden stimuli"}},
    {"id": "f_absent_hex_a", "type": "finding", "name": "Absent hexosaminidase A", "properties": {"description": "Deficiency of hexosaminidase A enzyme"}},
    
    # Conditions
    {"id": "c_tay_sachs", "type": "condition", "name": "Tay-Sachs disease", "properties": {"inheritance": "autosomal recessive", "gene": "HEXA"}},
    {"id": "c_niemann_pick_a", "type": "condition", "name": "Niemann-Pick type A", "properties": {"inheritance": "autosomal recessive", "gene": "SMPD1"}},
    {"id": "c_gaucher_1", "type": "condition", "name": "Gaucher disease type 1", "properties": {"inheritance": "autosomal recessive", "gene": "GBA"}},
    {"id": "c_gaucher_2", "type": "condition", "name": "Gaucher disease type 2", "properties": {"inheritance": "autosomal recessive", "gene": "GBA"}},
    {"id": "c_fabry", "type": "condition", "name": "Fabry disease", "properties": {"inheritance": "X-linked recessive", "gene": "GLA"}},
    {"id": "c_krabbe", "type": "condition", "name": "Krabbe disease", "properties": {"inheritance": "autosomal recessive", "gene": "GALC"}},
    {"id": "c_sandhoff", "type": "condition", "name": "Sandhoff disease", "properties": {"inheritance": "autosomal recessive", "gene": "HEXB"}},
    
    # Genes
    {"id": "g_hexa", "type": "gene", "name": "HEXA", "properties": {"chromosome": "15q23-q24", "function": "Alpha subunit of hexosaminidase A"}},
    {"id": "g_hexb", "type": "gene", "name": "HEXB", "properties": {"chromosome": "5q13", "function": "Beta subunit of hexosaminidase"}},
    {"id": "g_smpd1", "type": "gene", "name": "SMPD1", "properties": {"chromosome": "11p15.4", "function": "Acid sphingomyelinase"}},
    {"id": "g_gba", "type": "gene", "name": "GBA", "properties": {"chromosome": "1q22", "function": "Glucocerebrosidase"}},
    {"id": "g_gla", "type": "gene", "name": "GLA", "properties": {"chromosome": "Xq22.1", "function": "Alpha-galactosidase A"}},
    {"id": "g_galc", "type": "gene", "name": "GALC", "properties": {"chromosome": "14q31.3", "function": "Galactocerebrosidase"}},
    
    # Enzymes/Mechanisms
    {"id": "e_hexosaminidase_a", "type": "mechanism", "name": "Hexosaminidase A", "properties": {"function": "Degrades GM2 ganglioside"}},
    {"id": "e_acid_sphingomyelinase", "type": "mechanism", "name": "Acid sphingomyelinase", "properties": {"function": "Degrades sphingomyelin"}},
    {"id": "e_glucocerebrosidase", "type": "mechanism", "name": "Glucocerebrosidase", "properties": {"function": "Degrades glucocerebroside"}},
    {"id": "e_alpha_galactosidase_a", "type": "mechanism", "name": "Alpha-galactosidase A", "properties": {"function": "Degrades globotriaosylceramide"}},
    {"id": "e_galactocerebrosidase", "type": "mechanism", "name": "Galactocerebrosidase", "properties": {"function": "Degrades galactocerebroside"}},
    
    # Inheritance patterns
    {"id": "i_ar", "type": "inheritance", "name": "Autosomal recessive", "properties": {"description": "Requires two copies of mutated gene"}},
    {"id": "i_xlr", "type": "inheritance", "name": "X-linked recessive", "properties": {"description": "Mutation on X chromosome, affects males more"}},
    
    # Populations
    {"id": "p_ashkenazi", "type": "population", "name": "Ashkenazi Jewish", "properties": {"carrier_frequency": "1/30 for Tay-Sachs"}},
]

# Relationships
edges = [
    # Tay-Sachs relationships
    {"source": "c_tay_sachs", "target": "f_cherry_red_spot", "relationship": "HAS_FINDING", "weight": 0.95},
    {"source": "c_tay_sachs", "target": "f_developmental_regression", "relationship": "HAS_FINDING", "weight": 0.9},
    {"source": "c_tay_sachs", "target": "f_startle_response", "relationship": "HAS_FINDING", "weight": 0.9},
    {"source": "c_tay_sachs", "target": "f_seizures", "relationship": "HAS_FINDING", "weight": 0.7},
    {"source": "c_tay_sachs", "target": "f_hypotonia", "relationship": "HAS_FINDING", "weight": 0.8},
    {"source": "c_tay_sachs", "target": "g_hexa", "relationship": "CAUSED_BY", "weight": 1.0},
    {"source": "c_tay_sachs", "target": "e_hexosaminidase_a", "relationship": "ENZYME_DEFICIENCY", "weight": 1.0},
    {"source": "c_tay_sachs", "target": "i_ar", "relationship": "HAS_INHERITANCE", "weight": 1.0},
    {"source": "c_tay_sachs", "target": "p_ashkenazi", "relationship": "HIGH_PREVALENCE", "weight": 0.9},
    
    # Niemann-Pick type A relationships
    {"source": "c_niemann_pick_a", "target": "f_cherry_red_spot", "relationship": "HAS_FINDING", "weight": 0.5},
    {"source": "c_niemann_pick_a", "target": "f_hepatosplenomegaly", "relationship": "HAS_FINDING", "weight": 0.95},
    {"source": "c_niemann_pick_a", "target": "f_developmental_regression", "relationship": "HAS_FINDING", "weight": 0.9},
    {"source": "c_niemann_pick_a", "target": "f_failure_to_thrive", "relationship": "HAS_FINDING", "weight": 0.8},
    {"source": "c_niemann_pick_a", "target": "g_smpd1", "relationship": "CAUSED_BY", "weight": 1.0},
    {"source": "c_niemann_pick_a", "target": "e_acid_sphingomyelinase", "relationship": "ENZYME_DEFICIENCY", "weight": 1.0},
    {"source": "c_niemann_pick_a", "target": "i_ar", "relationship": "HAS_INHERITANCE", "weight": 1.0},
    {"source": "c_niemann_pick_a", "target": "p_ashkenazi", "relationship": "HIGH_PREVALENCE", "weight": 0.8},
    
    # Gaucher type 1 relationships
    {"source": "c_gaucher_1", "target": "f_hepatosplenomegaly", "relationship": "HAS_FINDING", "weight": 0.9},
    {"source": "c_gaucher_1", "target": "f_failure_to_thrive", "relationship": "HAS_FINDING", "weight": 0.6},
    {"source": "c_gaucher_1", "target": "g_gba", "relationship": "CAUSED_BY", "weight": 1.0},
    {"source": "c_gaucher_1", "target": "e_glucocerebrosidase", "relationship": "ENZYME_DEFICIENCY", "weight": 1.0},
    {"source": "c_gaucher_1", "target": "i_ar", "relationship": "HAS_INHERITANCE", "weight": 1.0},
    {"source": "c_gaucher_1", "target": "p_ashkenazi", "relationship": "HIGH_PREVALENCE", "weight": 0.9},
    
    # Gaucher type 2 relationships (acute neuronopathic)
    {"source": "c_gaucher_2", "target": "f_hepatosplenomegaly", "relationship": "HAS_FINDING", "weight": 0.8},
    {"source": "c_gaucher_2", "target": "f_developmental_regression", "relationship": "HAS_FINDING", "weight": 0.9},
    {"source": "c_gaucher_2", "target": "f_seizures", "relationship": "HAS_FINDING", "weight": 0.7},
    {"source": "c_gaucher_2", "target": "g_gba", "relationship": "CAUSED_BY", "weight": 1.0},
    {"source": "c_gaucher_2", "target": "e_glucocerebrosidase", "relationship": "ENZYME_DEFICIENCY", "weight": 1.0},
    {"source": "c_gaucher_2", "target": "i_ar", "relationship": "HAS_INHERITANCE", "weight": 1.0},
    
    # Fabry relationships
    {"source": "c_fabry", "target": "g_gla", "relationship": "CAUSED_BY", "weight": 1.0},
    {"source": "c_fabry", "target": "e_alpha_galactosidase_a", "relationship": "ENZYME_DEFICIENCY", "weight": 1.0},
    {"source": "c_fabry", "target": "i_xlr", "relationship": "HAS_INHERITANCE", "weight": 1.0},
    
    # Krabbe relationships
    {"source": "c_krabbe", "target": "f_developmental_regression", "relationship": "HAS_FINDING", "weight": 0.9},
    {"source": "c_krabbe", "target": "f_seizures", "relationship": "HAS_FINDING", "weight": 0.7},
    {"source": "c_krabbe", "target": "f_hypotonia", "relationship": "HAS_FINDING", "weight": 0.8},
    {"source": "c_krabbe", "target": "g_galc", "relationship": "CAUSED_BY", "weight": 1.0},
    {"source": "c_krabbe", "target": "e_galactocerebrosidase", "relationship": "ENZYME_DEFICIENCY", "weight": 1.0},
    {"source": "c_krabbe", "target": "i_ar", "relationship": "HAS_INHERITANCE", "weight": 1.0},
    
    # Sandhoff relationships
    {"source": "c_sandhoff", "target": "f_cherry_red_spot", "relationship": "HAS_FINDING", "weight": 0.9},
    {"source": "c_sandhoff", "target": "f_developmental_regression", "relationship": "HAS_FINDING", "weight": 0.9},
    {"source": "c_sandhoff", "target": "f_hepatosplenomegaly", "relationship": "HAS_FINDING", "weight": 0.6},
    {"source": "c_sandhoff", "target": "g_hexb", "relationship": "CAUSED_BY", "weight": 1.0},
    {"source": "c_sandhoff", "target": "i_ar", "relationship": "HAS_INHERITANCE", "weight": 1.0},
    
    # Gene-Enzyme relationships
    {"source": "g_hexa", "target": "e_hexosaminidase_a", "relationship": "ENCODES", "weight": 1.0},
    {"source": "g_hexb", "target": "e_hexosaminidase_a", "relationship": "ENCODES", "weight": 1.0},
    {"source": "g_smpd1", "target": "e_acid_sphingomyelinase", "relationship": "ENCODES", "weight": 1.0},
    {"source": "g_gba", "target": "e_glucocerebrosidase", "relationship": "ENCODES", "weight": 1.0},
    {"source": "g_gla", "target": "e_alpha_galactosidase_a", "relationship": "ENCODES", "weight": 1.0},
    {"source": "g_galc", "target": "e_galactocerebrosidase", "relationship": "ENCODES", "weight": 1.0},
    
    # Finding co-occurrence (for reasoning paths)
    {"source": "f_cherry_red_spot", "target": "f_developmental_regression", "relationship": "CO_OCCURS_WITH", "weight": 0.7},
    {"source": "f_hepatosplenomegaly", "target": "f_failure_to_thrive", "relationship": "CO_OCCURS_WITH", "weight": 0.6},
]


def seed_graph():
    """Seed the knowledge graph with nodes and edges."""
    print("Seeding GeneReason Knowledge Graph...")
    print(f"API URL: {BASE_URL}")
    
    # Create nodes
    print(f"\nCreating {len(nodes)} nodes...")
    node_success = 0
    for node in nodes:
        try:
            response = httpx.post(
                f"{BASE_URL}/graph/nodes",
                json=node,
                timeout=10.0
            )
            if response.status_code == 200:
                node_success += 1
                print(f"  ✓ Node {node['id']}: {node['name']}")
            else:
                print(f"  ✗ Node {node['id']}: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"  ✗ Node {node['id']}: {str(e)}")
    
    print(f"\nCreated {node_success}/{len(nodes)} nodes successfully")
    
    # Create edges
    print(f"\nCreating {len(edges)} edges...")
    edge_success = 0
    for edge in edges:
        try:
            edge_with_id = {
                "id": f"{edge['source']}_{edge['relationship']}_{edge['target']}",
                **edge
            }
            response = httpx.post(
                f"{BASE_URL}/graph/edges",
                json=edge_with_id,
                timeout=10.0
            )
            if response.status_code == 200:
                edge_success += 1
                print(f"  ✓ Edge: {edge['source']} --[{edge['relationship']}]--> {edge['target']}")
            else:
                print(f"  ✗ Edge {edge['source']}->{edge['target']}: {response.status_code}")
        except Exception as e:
            print(f"  ✗ Edge {edge['source']}->{edge['target']}: {str(e)}")
    
    print(f"\nCreated {edge_success}/{len(edges)} edges successfully")
    
    # Verify graph
    print("\nVerifying graph status...")
    try:
        response = httpx.get(f"{BASE_URL}/graph/status", timeout=10.0)
        if response.status_code == 200:
            status = response.json()
            print(f"  Status: {status.get('status')}")
            print(f"  Graph: {status.get('graph_name')}")
    except Exception as e:
        print(f"  Error checking status: {str(e)}")
    
    print("\n✅ Knowledge graph seeding complete!")
    return node_success, edge_success


if __name__ == "__main__":
    try:
        node_success, edge_success = seed_graph()
        sys.exit(0 if node_success > 0 else 1)
    except KeyboardInterrupt:
        print("\nInterrupted")
        sys.exit(1)
