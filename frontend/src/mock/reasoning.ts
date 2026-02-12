import type {
    AssociationReasoning,
    HypotheticoReasoning,
    ConstraintReasoning,
    ArgumentReasoning,
    AllReasoningResult,
} from '../types';

// =====================================================
// Question 001 - Tay-Sachs vs Niemann-Pick differential
// =====================================================

const q001_association: AssociationReasoning = {
    strategy: 'association',
    question_id: 'q001',
    steps: [
        {
            step_number: 1,
            description: 'Identify key clinical findings from the case presentation',
            evidence: ['4-month-old infant', 'failure to thrive', 'hepatosplenomegaly', 'developmental regression', 'cherry-red spot', 'absent hexosaminidase A'],
        },
        {
            step_number: 2,
            description: 'Map findings to potential conditions using knowledge graph',
            evidence: ['Tay-Sachs disease', 'Niemann-Pick type A', 'Gaucher disease'],
        },
        {
            step_number: 3,
            description: 'Calculate association strengths based on finding-condition relationships',
            supports: ['B'],
            opposes: ['A', 'C'],
        },
        {
            step_number: 4,
            description: 'The finding of absent hexosaminidase A is pathognomonic for Tay-Sachs disease',
            supports: ['B'],
            evidence: ['HEXA gene mutation causes hexosaminidase A deficiency'],
        },
    ],
    conclusion: 'Tay-Sachs disease (Option B) has the strongest association with the clinical findings, particularly the pathognomonic absence of hexosaminidase A activity.',
    confidence: 0.98,
    correct_option: 'B',
    key_findings: ['Absent hexosaminidase A', 'Cherry-red spot', 'Developmental regression'],
    linked_conditions: [
        {
            condition: 'Tay-Sachs disease',
            strength: 0.98,
            matching_findings: ['cherry-red spot', 'absent hex A', 'developmental regression'],
        },
        {
            condition: 'Niemann-Pick type A',
            strength: 0.45,
            matching_findings: ['cherry-red spot', 'hepatosplenomegaly'],
        },
        {
            condition: 'Gaucher disease',
            strength: 0.25,
            matching_findings: ['hepatosplenomegaly'],
        },
    ],
};

const q001_hypothetico: HypotheticoReasoning = {
    strategy: 'hypothetico',
    question_id: 'q001',
    steps: [
        {
            step_number: 1,
            description: 'Formulate hypotheses for each diagnostic option',
        },
        {
            step_number: 2,
            description: 'Test each hypothesis against clinical findings',
        },
        {
            step_number: 3,
            description: 'Evaluate hypothesis verification/falsification status',
        },
        {
            step_number: 4,
            description: 'Select the hypothesis best supported by evidence',
            supports: ['B'],
        },
    ],
    conclusion: 'The hypothesis of Tay-Sachs disease is verified by the finding of absent hexosaminidase A, while other hypotheses are falsified.',
    confidence: 0.95,
    correct_option: 'B',
    hypotheses: [
        {
            option: 'A',
            hypothesis: 'If Niemann-Pick type A, expect hepatosplenomegaly AND normal or elevated hexosaminidase A',
            predictions: ['Hepatosplenomegaly present', 'Hexosaminidase A normal/elevated', 'Sphingomyelinase deficiency'],
            verified: false,
            falsified: true,
        },
        {
            option: 'B',
            hypothesis: 'If Tay-Sachs disease, expect absent hexosaminidase A AND cherry-red spot WITHOUT hepatosplenomegaly',
            predictions: ['Absent hexosaminidase A', 'Cherry-red spot present', 'No organomegaly'],
            verified: true,
            falsified: false,
        },
        {
            option: 'C',
            hypothesis: 'If Gaucher disease, expect hepatosplenomegaly AND glucocerebrosidase deficiency',
            predictions: ['Hepatosplenomegaly', 'Gaucher cells on biopsy', 'Glucocerebrosidase deficient'],
            verified: false,
            falsified: true,
        },
        {
            option: 'D',
            hypothesis: 'If Fabry disease, expect alpha-galactosidase deficiency AND angiokeratomas',
            predictions: ['Angiokeratomas', 'Renal involvement', 'Alpha-galactosidase deficient'],
            verified: false,
            falsified: true,
        },
        {
            option: 'E',
            hypothesis: 'If Krabbe disease, expect galactocerebrosidase deficiency AND irritability',
            predictions: ['Irritability', 'Spasticity', 'Galactocerebrosidase deficient'],
            verified: false,
            falsified: true,
        },
    ],
};

const q001_constraints: ConstraintReasoning = {
    strategy: 'constraints',
    question_id: 'q001',
    steps: [
        {
            step_number: 1,
            description: 'Identify constraints from clinical findings',
        },
        {
            step_number: 2,
            description: 'Apply each constraint to eliminate incompatible options',
        },
        {
            step_number: 3,
            description: 'Identify remaining viable options',
        },
        {
            step_number: 4,
            description: 'Confirm final diagnosis',
            supports: ['B'],
        },
    ],
    conclusion: 'Only Tay-Sachs disease satisfies all constraints. All other options are eliminated by the finding of absent hexosaminidase A.',
    confidence: 0.99,
    correct_option: 'B',
    constraints: [
        {
            finding: 'Absent hexosaminidase A',
            eliminates: ['A', 'C', 'D', 'E'],
            reason: 'Niemann-Pick, Gaucher, Fabry, and Krabbe all have normal hexosaminidase A levels',
        },
        {
            finding: 'Cherry-red spot',
            eliminates: ['C', 'D', 'E'],
            reason: 'Gaucher, Fabry, and Krabbe do not typically present with cherry-red spot',
        },
        {
            finding: 'No hepatosplenomegaly (implied by normal liver enzymes)',
            eliminates: ['A', 'C'],
            reason: 'Niemann-Pick and Gaucher typically present with significant organomegaly',
        },
    ],
    remaining_options: ['B'],
};

const q001_arguments: ArgumentReasoning = {
    strategy: 'arguments',
    question_id: 'q001',
    steps: [
        {
            step_number: 1,
            description: 'Construct arguments for and against each option',
        },
        {
            step_number: 2,
            description: 'Weigh the strength of each argument',
        },
        {
            step_number: 3,
            description: 'Calculate net argument score for each option',
        },
        {
            step_number: 4,
            description: 'Select option with strongest net argument',
            supports: ['B'],
        },
    ],
    conclusion: 'Tay-Sachs disease has the strongest net argument with definitive evidence (absent hex A) and no opposing findings.',
    confidence: 0.97,
    correct_option: 'B',
    arguments: [
        {
            option: 'A',
            pros: ['Can present with cherry-red spot', 'Infantile onset matches age'],
            cons: ['Hepatosplenomegaly expected but not prominent', 'Hexosaminidase A would be normal', 'Sphingomyelinase would be deficient'],
            net_score: -2,
        },
        {
            option: 'B',
            pros: ['Absent hexosaminidase A is diagnostic', 'Cherry-red spot classic finding', 'Developmental regression typical', 'No organomegaly expected', 'Age of onset matches perfectly'],
            cons: [],
            net_score: 5,
        },
        {
            option: 'C',
            pros: ['Can present in infancy'],
            cons: ['Hepatosplenomegaly is hallmark', 'Glucocerebrosidase would be deficient', 'No cherry-red spot typically'],
            net_score: -3,
        },
        {
            option: 'D',
            pros: ['X-linked lysosomal disorder'],
            cons: ['Typically presents later', 'Angiokeratomas expected', 'Alpha-galactosidase deficient', 'No cherry-red spot'],
            net_score: -4,
        },
        {
            option: 'E',
            pros: ['Infantile neurodegenerative disorder'],
            cons: ['Extreme irritability expected', 'Galactocerebrosidase deficient', 'No cherry-red spot typically'],
            net_score: -3,
        },
    ],
};

// =====================================================
// Question 002 - Duchenne Muscular Dystrophy
// =====================================================

const q002_association: AssociationReasoning = {
    strategy: 'association',
    question_id: 'q002',
    steps: [
        {
            step_number: 1,
            description: 'Identify key clinical findings',
            evidence: ['6-year-old boy', 'progressive difficulty walking', 'toe-walking', 'calf pseudohypertrophy', 'proximal muscle weakness', 'CK 15,000 U/L'],
        },
        {
            step_number: 2,
            description: 'Associate findings with muscular dystrophies',
            supports: ['B'],
            opposes: ['A', 'C', 'D', 'E'],
        },
        {
            step_number: 3,
            description: 'Calf pseudohypertrophy and markedly elevated CK are characteristic of Duchenne',
            supports: ['B'],
        },
    ],
    conclusion: 'Duchenne muscular dystrophy has the strongest association given the classic triad: calf pseudohypertrophy, proximal weakness, and markedly elevated CK in a young boy.',
    confidence: 0.96,
    correct_option: 'B',
    key_findings: ['Calf pseudohypertrophy', 'CK 15,000 U/L', 'Proximal muscle weakness', 'Male child'],
    linked_conditions: [
        {
            condition: 'Duchenne muscular dystrophy',
            strength: 0.96,
            matching_findings: ['calf pseudohypertrophy', 'proximal weakness', 'toe-walking', 'high CK', 'male gender'],
        },
        {
            condition: 'Becker muscular dystrophy',
            strength: 0.55,
            matching_findings: ['proximal weakness', 'male gender'],
        },
        {
            condition: 'Spinal muscular atrophy',
            strength: 0.30,
            matching_findings: ['proximal weakness'],
        },
    ],
};

const q002_hypothetico: HypotheticoReasoning = {
    strategy: 'hypothetico',
    question_id: 'q002',
    steps: [
        {
            step_number: 1,
            description: 'Formulate diagnostic hypotheses',
        },
        {
            step_number: 2,
            description: 'Test hypotheses against clinical and laboratory findings',
        },
        {
            step_number: 3,
            description: 'CK level of 15,000 is most consistent with Duchenne',
            supports: ['B'],
        },
    ],
    conclusion: 'Duchenne muscular dystrophy hypothesis is verified by the combination of pseudohypertrophy, age of onset, and markedly elevated CK.',
    confidence: 0.94,
    correct_option: 'B',
    hypotheses: [
        {
            option: 'A',
            hypothesis: 'If SMA type 2, expect normal or mildly elevated CK and anterior horn cell signs',
            predictions: ['Tongue fasciculations', 'Areflexia', 'CK normal/mildly elevated'],
            verified: false,
            falsified: true,
        },
        {
            option: 'B',
            hypothesis: 'If DMD, expect very high CK, pseudohypertrophy, and X-linked inheritance pattern',
            predictions: ['CK >10,000', 'Calf pseudohypertrophy', 'Gowers sign', 'Male gender'],
            verified: true,
            falsified: false,
        },
        {
            option: 'C',
            hypothesis: 'If Becker, expect later onset and milder course',
            predictions: ['Onset after age 12', 'Ambulation preserved longer', 'CK elevated but lower'],
            verified: false,
            falsified: true,
        },
        {
            option: 'D',
            hypothesis: 'If LGMD, expect autosomal inheritance and variable CK',
            predictions: ['Autosomal inheritance', 'Variable CK levels', 'Equal male/female'],
            verified: false,
            falsified: true,
        },
        {
            option: 'E',
            hypothesis: 'If myotonic dystrophy, expect myotonia and distal weakness',
            predictions: ['Myotonia', 'Distal > proximal weakness', 'Cataracts', 'Cardiac involvement'],
            verified: false,
            falsified: true,
        },
    ],
};

const q002_constraints: ConstraintReasoning = {
    strategy: 'constraints',
    question_id: 'q002',
    steps: [
        {
            step_number: 1,
            description: 'Apply constraint of markedly elevated CK (15,000 U/L)',
        },
        {
            step_number: 2,
            description: 'Apply constraint of calf pseudohypertrophy',
        },
        {
            step_number: 3,
            description: 'Apply constraint of age and gender',
        },
    ],
    conclusion: 'Only Duchenne MD satisfies all constraints: very high CK, pseudohypertrophy, and early onset in a male.',
    confidence: 0.95,
    correct_option: 'B',
    constraints: [
        {
            finding: 'CK 15,000 U/L (markedly elevated)',
            eliminates: ['A', 'E'],
            reason: 'SMA has normal/mildly elevated CK; myotonic dystrophy has mild elevation',
        },
        {
            finding: 'Calf pseudohypertrophy',
            eliminates: ['A', 'D', 'E'],
            reason: 'Pseudohypertrophy is characteristic of dystrophinopathies (DMD/BMD)',
        },
        {
            finding: 'Age 6 with progressive symptoms since age 3',
            eliminates: ['C'],
            reason: 'Becker typically has later onset (>12 years) and milder course',
        },
    ],
    remaining_options: ['B'],
};

const q002_arguments: ArgumentReasoning = {
    strategy: 'arguments',
    question_id: 'q002',
    steps: [
        {
            step_number: 1,
            description: 'Build argument case for each option',
        },
        {
            step_number: 2,
            description: 'Weigh diagnostic criteria for dystrophinopathies',
        },
    ],
    conclusion: 'Duchenne MD has overwhelming support from pseudohypertrophy, CK level, age of onset, and gender.',
    confidence: 0.95,
    correct_option: 'B',
    arguments: [
        {
            option: 'A',
            pros: ['Causes proximal weakness in children'],
            cons: ['CK typically normal', 'No pseudohypertrophy', 'Tongue fasciculations expected'],
            net_score: -2,
        },
        {
            option: 'B',
            pros: ['CK markedly elevated - classic', 'Calf pseudohypertrophy - pathognomonic', 'Age of onset typical', 'X-linked inheritance fits male patient', 'Progressive course expected'],
            cons: [],
            net_score: 5,
        },
        {
            option: 'C',
            pros: ['Same gene as DMD', 'Can have pseudohypertrophy'],
            cons: ['Later onset expected', 'Milder CK elevation', 'Better preserved ambulation'],
            net_score: -1,
        },
        {
            option: 'D',
            pros: ['Can cause proximal weakness'],
            cons: ['Autosomal inheritance', 'No pseudohypertrophy typically', 'Variable CK'],
            net_score: -2,
        },
        {
            option: 'E',
            pros: ['Muscular dystrophy with weakness'],
            cons: ['Distal weakness predominates', 'Myotonia is hallmark', 'CK only mildly elevated', 'Autosomal dominant'],
            net_score: -3,
        },
    ],
};

// =====================================================
// Question 003 - Methylmalonic Acidemia
// =====================================================

const q003_association: AssociationReasoning = {
    strategy: 'association',
    question_id: 'q003',
    steps: [
        {
            step_number: 1,
            description: 'Identify metabolic decompensation findings',
            evidence: ['2-week-old newborn', 'poor feeding', 'lethargy', 'seizures', 'hypoglycemia', 'hyperammonemia', 'metabolic acidosis', 'elevated methylmalonic acid'],
        },
        {
            step_number: 2,
            description: 'The elevated methylmalonic acid in urine is diagnostic',
            supports: ['B'],
        },
    ],
    conclusion: 'The presence of elevated methylmalonic acid in urine organic acids is diagnostic for methylmalonic acidemia.',
    confidence: 0.99,
    correct_option: 'B',
    key_findings: ['Elevated methylmalonic acid', 'Metabolic acidosis', 'Hyperammonemia', 'Neonatal presentation'],
    linked_conditions: [
        {
            condition: 'Methylmalonic acidemia',
            strength: 0.99,
            matching_findings: ['elevated methylmalonic acid', 'metabolic acidosis', 'hyperammonemia', 'hypoglycemia'],
        },
        {
            condition: 'Propionic acidemia',
            strength: 0.65,
            matching_findings: ['metabolic acidosis', 'hyperammonemia'],
        },
        {
            condition: 'Urea cycle disorder',
            strength: 0.35,
            matching_findings: ['hyperammonemia'],
        },
    ],
};

const q003_hypothetico: HypotheticoReasoning = {
    strategy: 'hypothetico',
    question_id: 'q003',
    steps: [
        {
            step_number: 1,
            description: 'Formulate hypotheses for neonatal metabolic crisis',
        },
        {
            step_number: 2,
            description: 'Test hypothesis using urine organic acid results',
        },
    ],
    conclusion: 'Methylmalonic acidemia hypothesis is verified by the definitive finding of elevated methylmalonic acid.',
    confidence: 0.99,
    correct_option: 'B',
    hypotheses: [
        {
            option: 'A',
            hypothesis: 'If propionic acidemia, expect elevated propionic acid and propionyl metabolites',
            predictions: ['Elevated propionylcarnitine', 'Propionic acid in urine', 'No methylmalonic acid'],
            verified: false,
            falsified: true,
        },
        {
            option: 'B',
            hypothesis: 'If MMA, expect elevated methylmalonic acid with metabolic acidosis',
            predictions: ['Elevated methylmalonic acid', 'Metabolic acidosis', 'Hyperammonemia', 'Hypoglycemia'],
            verified: true,
            falsified: false,
        },
        {
            option: 'C',
            hypothesis: 'If isovaleric acidemia, expect sweaty feet odor and isovalerylglycine',
            predictions: ['Sweaty feet odor', 'Isovalerylglycine in urine', 'No methylmalonic acid'],
            verified: false,
            falsified: true,
        },
        {
            option: 'D',
            hypothesis: 'If MSUD, expect elevated branched-chain amino acids',
            predictions: ['Elevated leucine, isoleucine, valine', 'Maple syrup odor', 'No acidosis typically'],
            verified: false,
            falsified: true,
        },
        {
            option: 'E',
            hypothesis: 'If urea cycle disorder, expect hyperammonemia without acidosis',
            predictions: ['Hyperammonemia', 'Respiratory alkalosis', 'Normal organic acids'],
            verified: false,
            falsified: true,
        },
    ],
};

const q003_constraints: ConstraintReasoning = {
    strategy: 'constraints',
    question_id: 'q003',
    steps: [
        {
            step_number: 1,
            description: 'Apply constraint of elevated methylmalonic acid',
        },
        {
            step_number: 2,
            description: 'Apply constraint of metabolic acidosis with elevated anion gap',
        },
    ],
    conclusion: 'The finding of elevated methylmalonic acid is pathognomonic and eliminates all other options.',
    confidence: 0.99,
    correct_option: 'B',
    constraints: [
        {
            finding: 'Elevated methylmalonic acid in urine',
            eliminates: ['A', 'C', 'D', 'E'],
            reason: 'Only methylmalonic acidemia produces elevated methylmalonic acid',
        },
        {
            finding: 'Metabolic acidosis with elevated anion gap',
            eliminates: ['D', 'E'],
            reason: 'MSUD typically has no acidosis; UCD has respiratory alkalosis',
        },
        {
            finding: 'Hyperammonemia',
            eliminates: [],
            reason: 'Consistent with both organic acidemias and urea cycle disorders',
        },
    ],
    remaining_options: ['B'],
};

const q003_arguments: ArgumentReasoning = {
    strategy: 'arguments',
    question_id: 'q003',
    steps: [
        {
            step_number: 1,
            description: 'Build arguments based on metabolic findings',
        },
    ],
    conclusion: 'Methylmalonic acidemia has definitive laboratory evidence with no opposing findings.',
    confidence: 0.99,
    correct_option: 'B',
    arguments: [
        {
            option: 'A',
            pros: ['Similar presentation', 'Organic acidemia'],
            cons: ['Would show elevated propionic acid, not methylmalonic acid'],
            net_score: -1,
        },
        {
            option: 'B',
            pros: ['Elevated methylmalonic acid is diagnostic', 'Metabolic acidosis fits', 'Hyperammonemia common', 'Neonatal presentation classic', 'Hypoglycemia consistent'],
            cons: [],
            net_score: 5,
        },
        {
            option: 'C',
            pros: ['Organic acidemia with similar presentation'],
            cons: ['Would show isovalerylglycine', 'Sweaty feet odor expected', 'Different organic acid profile'],
            net_score: -2,
        },
        {
            option: 'D',
            pros: ['Can cause neonatal encephalopathy'],
            cons: ['Maple syrup odor expected', 'No metabolic acidosis typically', 'Elevated BCAA, not MMA'],
            net_score: -3,
        },
        {
            option: 'E',
            pros: ['Causes hyperammonemia'],
            cons: ['Respiratory alkalosis, not metabolic acidosis', 'Normal organic acids', 'No hypoglycemia typically'],
            net_score: -3,
        },
    ],
};

// =====================================================
// Question 006 - Prader-Willi Syndrome
// =====================================================

const q006_association: AssociationReasoning = {
    strategy: 'association',
    question_id: 'q006',
    steps: [
        {
            step_number: 1,
            description: 'Identify findings in two phases: neonatal and later childhood',
            evidence: ['neonatal hypotonia', 'feeding difficulties', 'cryptorchidism', 'narrow bifrontal diameter', 'almond-shaped eyes', 'small hands/feet', 'hyperphagia', 'obesity'],
        },
        {
            step_number: 2,
            description: 'The combination of neonatal hypotonia followed by hyperphagia is characteristic',
            supports: ['B'],
        },
    ],
    conclusion: 'Prader-Willi syndrome is strongly associated with the biphasic presentation: neonatal hypotonia/feeding difficulties followed by hyperphagia/obesity.',
    confidence: 0.97,
    correct_option: 'B',
    key_findings: ['Neonatal hypotonia', 'Hyperphagia after 6 months', 'Cryptorchidism', 'Almond-shaped eyes', 'Small hands/feet'],
    linked_conditions: [
        {
            condition: 'Prader-Willi syndrome',
            strength: 0.97,
            matching_findings: ['neonatal hypotonia', 'feeding difficulties', 'cryptorchidism', 'almond eyes', 'hyperphagia', 'obesity'],
        },
        {
            condition: 'Angelman syndrome',
            strength: 0.35,
            matching_findings: ['hypotonia'],
        },
        {
            condition: 'Beckwith-Wiedemann',
            strength: 0.25,
            matching_findings: ['neonatal findings'],
        },
    ],
};

const q006_hypothetico: HypotheticoReasoning = {
    strategy: 'hypothetico',
    question_id: 'q006',
    steps: [
        {
            step_number: 1,
            description: 'Formulate hypotheses based on neonatal presentation',
        },
        {
            step_number: 2,
            description: 'Test hypotheses against the developmental progression',
        },
    ],
    conclusion: 'Prader-Willi hypothesis is verified by the characteristic progression from neonatal hypotonia to childhood hyperphagia.',
    confidence: 0.96,
    correct_option: 'B',
    hypotheses: [
        {
            option: 'A',
            hypothesis: 'If Angelman, expect severe developmental delay, seizures, and happy demeanor',
            predictions: ['Severe intellectual disability', 'Inappropriate laughter', 'Seizures', 'Ataxia'],
            verified: false,
            falsified: true,
        },
        {
            option: 'B',
            hypothesis: 'If PWS, expect neonatal hypotonia, then hyperphagia with obesity',
            predictions: ['Neonatal hypotonia', 'Poor feeding initially', 'Hyperphagia after infancy', 'Obesity', 'Hypogonadism'],
            verified: true,
            falsified: false,
        },
        {
            option: 'C',
            hypothesis: 'If Beckwith-Wiedemann, expect macrosomia and omphalocele',
            predictions: ['Macrosomia', 'Macroglossia', 'Omphalocele/umbilical hernia', 'Hypoglycemia'],
            verified: false,
            falsified: true,
        },
        {
            option: 'D',
            hypothesis: 'If Silver-Russell, expect growth restriction and asymmetry',
            predictions: ['Small for gestational age', 'Body asymmetry', 'Feeding difficulties', 'No obesity'],
            verified: false,
            falsified: true,
        },
        {
            option: 'E',
            hypothesis: 'If Williams, expect elfin facies and cardiac issues',
            predictions: ['Supravalvular aortic stenosis', 'Elf-like facies', 'Friendly personality', 'Hypercalcemia'],
            verified: false,
            falsified: true,
        },
    ],
};

const q006_constraints: ConstraintReasoning = {
    strategy: 'constraints',
    question_id: 'q006',
    steps: [
        {
            step_number: 1,
            description: 'Apply constraint of biphasic feeding pattern',
        },
        {
            step_number: 2,
            description: 'Apply constraint of dysmorphic features',
        },
    ],
    conclusion: 'Only Prader-Willi explains the transition from poor feeding to hyperphagia with the characteristic dysmorphic features.',
    confidence: 0.96,
    correct_option: 'B',
    constraints: [
        {
            finding: 'Neonatal hypotonia with poor feeding',
            eliminates: ['C', 'E'],
            reason: 'Beckwith-Wiedemann has macroglossia with good feeding; Williams has normal tone',
        },
        {
            finding: 'Hyperphagia and obesity developing after 6 months',
            eliminates: ['A', 'C', 'D', 'E'],
            reason: 'This biphasic pattern is pathognomonic for PWS',
        },
        {
            finding: 'Cryptorchidism',
            eliminates: [],
            reason: 'Supports hypogonadism seen in PWS',
        },
    ],
    remaining_options: ['B'],
};

const q006_arguments: ArgumentReasoning = {
    strategy: 'arguments',
    question_id: 'q006',
    steps: [
        {
            step_number: 1,
            description: 'Build arguments based on clinical features',
        },
    ],
    conclusion: 'Prader-Willi syndrome has the strongest argument with multiple pathognomonic features.',
    confidence: 0.96,
    correct_option: 'B',
    arguments: [
        {
            option: 'A',
            pros: ['Same chromosomal region (15q11-q13)', 'Can have hypotonia'],
            cons: ['Severe intellectual disability expected', 'Happy demeanor typical', 'No hyperphagia/obesity', 'Seizures common'],
            net_score: -3,
        },
        {
            option: 'B',
            pros: ['Neonatal hypotonia classic', 'Poor feeding in infancy', 'Hyperphagia after 6 months - pathognomonic', 'Cryptorchidism typical', 'Almond-shaped eyes characteristic', 'Small hands/feet consistent'],
            cons: [],
            net_score: 6,
        },
        {
            option: 'C',
            pros: ['Neonatal presentation'],
            cons: ['Macrosomia expected, not normal size', 'Macroglossia characteristic', 'Omphalocele common', 'No hyperphagia'],
            net_score: -3,
        },
        {
            option: 'D',
            pros: ['Can have feeding difficulties'],
            cons: ['Growth restriction expected', 'Body asymmetry characteristic', 'No hyperphagia/obesity'],
            net_score: -3,
        },
        {
            option: 'E',
            pros: ['Distinctive facies'],
            cons: ['Different facial features (elfin)', 'Cardiac disease expected', 'Friendly personality', 'No hyperphagia'],
            net_score: -3,
        },
    ],
};

// =====================================================
// Aggregated exports
// =====================================================

export const mockReasoning: Record<string, AllReasoningResult[]> = {
    q001: [q001_association, q001_hypothetico, q001_constraints, q001_arguments],
    q002: [q002_association, q002_hypothetico, q002_constraints, q002_arguments],
    q003: [q003_association, q003_hypothetico, q003_constraints, q003_arguments],
    q006: [q006_association, q006_hypothetico, q006_constraints, q006_arguments],
};

export function getReasoningForQuestion(questionId: string): AllReasoningResult[] {
    return mockReasoning[questionId] || [];
}

export function getReasoningByStrategy(
    questionId: string,
    strategy: 'association' | 'hypothetico' | 'constraints' | 'arguments'
): AllReasoningResult | undefined {
    const results = mockReasoning[questionId];
    return results?.find((r) => r.strategy === strategy);
}
