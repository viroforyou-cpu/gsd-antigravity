import type { KnowledgeGraph } from '../types';

// Knowledge graph for q001 - Tay-Sachs question
export const graphQ001: KnowledgeGraph = {
    nodes: [
        { id: 'n1', type: 'finding', name: '4-month-old infant' },
        { id: 'n2', type: 'finding', name: 'Failure to thrive' },
        { id: 'n3', type: 'finding', name: 'Hepatosplenomegaly' },
        { id: 'n4', type: 'finding', name: 'Developmental regression' },
        { id: 'n5', type: 'finding', name: 'Cherry-red spot' },
        { id: 'n6', type: 'finding', name: 'Absent hexosaminidase A' },
        { id: 'n7', type: 'condition', name: 'Tay-Sachs disease' },
        { id: 'n8', type: 'condition', name: 'Niemann-Pick type A' },
        { id: 'n9', type: 'condition', name: 'Gaucher disease' },
        { id: 'n10', type: 'gene', name: 'HEXA gene' },
        { id: 'n11', type: 'gene', name: 'SMPD1 gene' },
        { id: 'n12', type: 'inheritance', name: 'Autosomal recessive' },
        { id: 'n13', type: 'mechanism', name: 'GM2 ganglioside accumulation' },
    ],
    edges: [
        { id: 'e1', source: 'n7', target: 'n5', relationship: 'HAS_FINDING', weight: 0.95 },
        { id: 'e2', source: 'n7', target: 'n6', relationship: 'HAS_FINDING', weight: 1.0 },
        { id: 'e3', source: 'n7', target: 'n4', relationship: 'HAS_FINDING', weight: 0.9 },
        { id: 'e4', source: 'n7', target: 'n10', relationship: 'CAUSED_BY', weight: 1.0 },
        { id: 'e5', source: 'n7', target: 'n13', relationship: 'CAUSED_BY', weight: 1.0 },
        { id: 'e6', source: 'n7', target: 'n12', relationship: 'INHERITED_AS', weight: 1.0 },
        { id: 'e7', source: 'n8', target: 'n3', relationship: 'HAS_FINDING', weight: 0.9 },
        { id: 'e8', source: 'n8', target: 'n5', relationship: 'HAS_FINDING', weight: 0.5 },
        { id: 'e9', source: 'n8', target: 'n11', relationship: 'CAUSED_BY', weight: 1.0 },
        { id: 'e10', source: 'n9', target: 'n3', relationship: 'HAS_FINDING', weight: 0.7 },
        { id: 'e11', source: 'n6', target: 'n7', relationship: 'SUPPORTS', weight: 0.95 },
        { id: 'e12', source: 'n5', target: 'n7', relationship: 'SUPPORTS', weight: 0.85 },
        { id: 'e13', source: 'n3', target: 'n8', relationship: 'SUPPORTS', weight: 0.8 },
        { id: 'e14', source: 'n3', target: 'n7', relationship: 'OPPOSES', weight: 0.7 },
    ],
};

// Knowledge graph for q002 - Duchenne muscular dystrophy
export const graphQ002: KnowledgeGraph = {
    nodes: [
        { id: 'n1', type: 'finding', name: '6-year-old boy' },
        { id: 'n2', type: 'finding', name: 'Progressive difficulty walking' },
        { id: 'n3', type: 'finding', name: 'Toe-walking' },
        { id: 'n4', type: 'finding', name: 'Calf pseudohypertrophy' },
        { id: 'n5', type: 'finding', name: 'Lumbar lordosis' },
        { id: 'n6', type: 'finding', name: 'Proximal muscle weakness' },
        { id: 'n7', type: 'finding', name: 'CK 15,000 U/L' },
        { id: 'n8', type: 'condition', name: 'Duchenne muscular dystrophy' },
        { id: 'n9', type: 'condition', name: 'Becker muscular dystrophy' },
        { id: 'n10', type: 'condition', name: 'Spinal muscular atrophy' },
        { id: 'n11', type: 'gene', name: 'DMD gene' },
        { id: 'n12', type: 'inheritance', name: 'X-linked recessive' },
        { id: 'n13', type: 'mechanism', name: 'Dystrophin deficiency' },
    ],
    edges: [
        { id: 'e1', source: 'n8', target: 'n4', relationship: 'HAS_FINDING', weight: 0.95 },
        { id: 'e2', source: 'n8', target: 'n6', relationship: 'HAS_FINDING', weight: 0.9 },
        { id: 'e3', source: 'n8', target: 'n7', relationship: 'HAS_FINDING', weight: 0.95 },
        { id: 'e4', source: 'n8', target: 'n3', relationship: 'HAS_FINDING', weight: 0.8 },
        { id: 'e5', source: 'n8', target: 'n11', relationship: 'CAUSED_BY', weight: 1.0 },
        { id: 'e6', source: 'n8', target: 'n12', relationship: 'INHERITED_AS', weight: 1.0 },
        { id: 'e7', source: 'n8', target: 'n13', relationship: 'CAUSED_BY', weight: 1.0 },
        { id: 'e8', source: 'n9', target: 'n4', relationship: 'HAS_FINDING', weight: 0.5 },
        { id: 'e9', source: 'n9', target: 'n6', relationship: 'HAS_FINDING', weight: 0.6 },
        { id: 'e10', source: 'n9', target: 'n11', relationship: 'CAUSED_BY', weight: 1.0 },
        { id: 'e11', source: 'n4', target: 'n8', relationship: 'SUPPORTS', weight: 0.9 },
        { id: 'e12', source: 'n7', target: 'n8', relationship: 'SUPPORTS', weight: 0.95 },
        { id: 'e13', source: 'n1', target: 'n8', relationship: 'SUPPORTS', weight: 0.7 },
    ],
};

// Knowledge graph for q003 - Methylmalonic acidemia
export const graphQ003: KnowledgeGraph = {
    nodes: [
        { id: 'n1', type: 'finding', name: '2-week-old newborn' },
        { id: 'n2', type: 'finding', name: 'Poor feeding' },
        { id: 'n3', type: 'finding', name: 'Lethargy' },
        { id: 'n4', type: 'finding', name: 'Seizures' },
        { id: 'n5', type: 'finding', name: 'Hypoglycemia' },
        { id: 'n6', type: 'finding', name: 'Hyperammonemia' },
        { id: 'n7', type: 'finding', name: 'Metabolic acidosis' },
        { id: 'n8', type: 'finding', name: 'Elevated methylmalonic acid' },
        { id: 'n9', type: 'condition', name: 'Methylmalonic acidemia' },
        { id: 'n10', type: 'condition', name: 'Propionic acidemia' },
        { id: 'n11', type: 'gene', name: 'MUT gene' },
        { id: 'n12', type: 'mechanism', name: 'B12 metabolism defect' },
        { id: 'n13', type: 'inheritance', name: 'Autosomal recessive' },
    ],
    edges: [
        { id: 'e1', source: 'n9', target: 'n8', relationship: 'HAS_FINDING', weight: 1.0 },
        { id: 'e2', source: 'n9', target: 'n7', relationship: 'HAS_FINDING', weight: 0.9 },
        { id: 'e3', source: 'n9', target: 'n6', relationship: 'HAS_FINDING', weight: 0.7 },
        { id: 'e4', source: 'n9', target: 'n5', relationship: 'HAS_FINDING', weight: 0.6 },
        { id: 'e5', source: 'n9', target: 'n11', relationship: 'CAUSED_BY', weight: 1.0 },
        { id: 'e6', source: 'n9', target: 'n12', relationship: 'CAUSED_BY', weight: 1.0 },
        { id: 'e7', source: 'n9', target: 'n13', relationship: 'INHERITED_AS', weight: 1.0 },
        { id: 'e8', source: 'n10', target: 'n7', relationship: 'HAS_FINDING', weight: 0.9 },
        { id: 'e9', source: 'n10', target: 'n6', relationship: 'HAS_FINDING', weight: 0.7 },
        { id: 'e10', source: 'n8', target: 'n9', relationship: 'SUPPORTS', weight: 1.0 },
        { id: 'e11', source: 'n7', target: 'n9', relationship: 'SUPPORTS', weight: 0.6 },
        { id: 'e12', source: 'n7', target: 'n10', relationship: 'SUPPORTS', weight: 0.6 },
    ],
};

// Knowledge graph for q006 - Prader-Willi syndrome
export const graphQ006: KnowledgeGraph = {
    nodes: [
        { id: 'n1', type: 'finding', name: 'Neonatal hypotonia' },
        { id: 'n2', type: 'finding', name: 'Feeding difficulties' },
        { id: 'n3', type: 'finding', name: 'Cryptorchidism' },
        { id: 'n4', type: 'finding', name: 'Narrow bifrontal diameter' },
        { id: 'n5', type: 'finding', name: 'Almond-shaped eyes' },
        { id: 'n6', type: 'finding', name: 'Small hands/feet' },
        { id: 'n7', type: 'finding', name: 'Hyperphagia' },
        { id: 'n8', type: 'finding', name: 'Obesity' },
        { id: 'n9', type: 'condition', name: 'Prader-Willi syndrome' },
        { id: 'n10', type: 'condition', name: 'Angelman syndrome' },
        { id: 'n11', type: 'gene', name: 'SNRPN (15q11-q13)' },
        { id: 'n12', type: 'inheritance', name: 'Paternal imprinting' },
        { id: 'n13', type: 'mechanism', name: 'Paternal deletion/maternal UPD' },
    ],
    edges: [
        { id: 'e1', source: 'n9', target: 'n1', relationship: 'HAS_FINDING', weight: 0.95 },
        { id: 'e2', source: 'n9', target: 'n2', relationship: 'HAS_FINDING', weight: 0.9 },
        { id: 'e3', source: 'n9', target: 'n3', relationship: 'HAS_FINDING', weight: 0.8 },
        { id: 'e4', source: 'n9', target: 'n7', relationship: 'HAS_FINDING', weight: 0.95 },
        { id: 'e5', source: 'n9', target: 'n8', relationship: 'HAS_FINDING', weight: 0.9 },
        { id: 'e6', source: 'n9', target: 'n11', relationship: 'CAUSED_BY', weight: 1.0 },
        { id: 'e7', source: 'n9', target: 'n12', relationship: 'INHERITED_AS', weight: 1.0 },
        { id: 'e8', source: 'n9', target: 'n13', relationship: 'CAUSED_BY', weight: 1.0 },
        { id: 'e9', source: 'n10', target: 'n11', relationship: 'CAUSED_BY', weight: 1.0 },
        { id: 'e10', source: 'n1', target: 'n9', relationship: 'SUPPORTS', weight: 0.9 },
        { id: 'e11', source: 'n7', target: 'n9', relationship: 'SUPPORTS', weight: 0.95 },
        { id: 'e12', source: 'n3', target: 'n9', relationship: 'SUPPORTS', weight: 0.7 },
    ],
};

// Map of question IDs to their knowledge graphs
export const mockGraphs: Record<string, KnowledgeGraph> = {
    q001: graphQ001,
    q002: graphQ002,
    q003: graphQ003,
    q006: graphQ006,
};
