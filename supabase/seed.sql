-- GeneReason Database Seed Data
-- Run this after migrations to populate initial data

-- ============================================
-- SAMPLE QUESTIONS
-- ============================================

INSERT INTO questions (id, stem, options, correct_answer, difficulty, category, explanation, key_concepts) VALUES
(
    '00000000-0000-0000-0000-000000000001'::uuid,
    'A 4-month-old infant presents with failure to thrive, hepatosplenomegaly, and developmental regression. Physical exam reveals cherry-red spot in the macula. Laboratory studies show normal liver enzymes but absent hexosaminidase A activity in leukocytes.',
    '{"A": "Niemann-Pick disease type A", "B": "Tay-Sachs disease", "C": "Gaucher disease type 1", "D": "Fabry disease", "E": "Krabbe disease"}',
    'B',
    'medium',
    'Lysosomal Storage Disorders',
    'Tay-Sachs disease is characterized by absent hexosaminidase A activity, cherry-red spot, and neurodegeneration without hepatosplenomegaly (which would suggest Niemann-Pick). The key differentiator is that Niemann-Pick type A presents with hepatosplenomegaly, while Tay-Sachs does not.',
    ARRAY['hexosaminidase A', 'cherry-red spot', 'lysosomal storage disease', 'GM2 gangliosidosis']
),
(
    '00000000-0000-0000-0000-000000000002'::uuid,
    'A 6-year-old boy presents with progressive ataxia, areflexia, and loss of vibration sense. Laboratory studies reveal elevated phytanic acid levels. Which inheritance pattern is most likely?',
    '{"A": "Autosomal dominant", "B": "Autosomal recessive", "C": "X-linked recessive", "D": "Mitochondrial", "E": "X-linked dominant"}',
    'B',
    'hard',
    'Neurologic Disorders',
    'Refsum disease is an autosomal recessive peroxisomal disorder characterized by elevated phytanic acid due to deficiency in phytanoyl-CoA hydroxylase. The classic triad includes retinitis pigmentosa, peripheral neuropathy, and cerebellar ataxia.',
    ARRAY['phytanic acid', 'peroxisomal disorder', 'ataxia', 'autosomal recessive', 'Refsum disease']
),
(
    '00000000-0000-0000-0000-000000000003'::uuid,
    'A newborn is found to have ambiguous genitalia, hypotension, and hyponatremia with hyperkalemia. Which enzyme deficiency is most likely?',
    '{"A": "21-hydroxylase", "B": "11β-hydroxylase", "C": "17α-hydroxylase", "D": "3β-hydroxysteroid dehydrogenase", "E": "Aromatase"}',
    'A',
    'medium',
    'Endocrine Disorders',
    '21-hydroxylase deficiency is the most common cause of congenital adrenal hyperplasia (CAH), presenting with salt-wasting (hyponatremia, hyperkalemia) due to mineralocorticoid deficiency, and virilization due to excess androgens. The classic form presents in infancy with adrenal crisis.',
    ARRAY['congenital adrenal hyperplasia', '21-hydroxylase', 'salt-wasting', 'ambiguous genitalia', 'hyperkalemia']
),
(
    '00000000-0000-0000-0000-000000000004'::uuid,
    'A 2-year-old girl presents with developmental delay, seizures, and a "tapetoretinal" degeneration. Brain MRI shows diffuse white matter abnormalities. Which finding would be most specific for the diagnosis?',
    '{"A": "Elevated very long-chain fatty acids", "B": "Elevated phytanic acid", "C": "Elevated pipecolic acid", "D": "Elevated methylmalonic acid", "E": "Elevated orotic acid"}',
    'A',
    'hard',
    'Neurologic Disorders',
    'X-linked adrenoleukodystrophy (X-ALD) is characterized by elevated very long-chain fatty acids (VLCFA) due to ABCD1 gene mutation affecting peroxisomal beta-oxidation. It presents with progressive demyelination, adrenal insufficiency, and cognitive decline in young males.',
    ARRAY['adrenoleukodystrophy', 'VLCFA', 'peroxisomal disorder', 'white matter disease', 'ABCD1']
),
(
    '00000000-0000-0000-0000-000000000005'::uuid,
    'A 3-month-old infant presents with severe hypotonia, feeding difficulties, and "frog-leg" positioning. EMG shows fibrillations and positive sharp waves. Which genetic finding is most likely?',
    '{"A": "SMN1 deletion", "B": "MECP2 mutation", "C": "DMD deletion", "D": "PAH mutation", "E": "CFTR mutation"}',
    'A',
    'easy',
    'Neuromuscular Disorders',
    'Spinal muscular atrophy (SMA) type 1 (Werdnig-Hoffmann disease) is caused by SMN1 gene deletion, presenting with severe hypotonia, "floppy infant" syndrome, tongue fasciculations, and eventual respiratory failure. EMG shows denervation changes consistent with anterior horn cell disease.',
    ARRAY['spinal muscular atrophy', 'SMN1', 'hypotonia', 'anterior horn cell', 'floppy infant']
),
(
    '00000000-0000-0000-0000-000000000006'::uuid,
    'A 5-year-old boy presents with developmental regression, acquired microcephaly, and loss of purposeful hand use. His mother reports he had normal development until 18 months of age. Physical exam reveals repetitive hand-wringing movements. What is the most likely diagnosis?',
    '{"A": "Angelman syndrome", "B": "Rett syndrome", "C": "Autism spectrum disorder", "D": "Fragile X syndrome", "E": "Prader-Willi syndrome"}',
    'B',
    'medium',
    'Neurodevelopmental Disorders',
    'Rett syndrome is an X-linked dominant disorder caused by MECP2 mutations, almost exclusively affecting females. It is characterized by normal early development followed by regression, loss of purposeful hand use, stereotypic hand-wringing, acquired microcephaly, and seizures.',
    ARRAY['Rett syndrome', 'MECP2', 'hand-wringing', 'developmental regression', 'X-linked dominant']
),
(
    '00000000-0000-0000-0000-000000000007'::uuid,
    'A 10-year-old girl presents with short stature, webbed neck, and coarctation of the aorta. Karyotype analysis reveals 45,X. Which additional finding is most likely to be present?',
    '{"A": "Intellectual disability", "B": "Streak gonads", "C": "Polydactyly", "D": "Hirsutism", "E": "Macroorchidism"}',
    'B',
    'easy',
    'Chromosomal Disorders',
    'Turner syndrome (45,X) is characterized by short stature, webbed neck, coarctation of the aorta, and streak gonads leading to primary amenorrhea and infertility. Intelligence is typically normal. The absence of one X chromosome leads to ovarian dysgenesis.',
    ARRAY['Turner syndrome', '45X', 'streak gonads', 'coarctation', 'short stature']
),
(
    '00000000-0000-0000-0000-000000000008'::uuid,
    'A newborn infant has hypotonia, feeding difficulties, and cryptorchidism. The mother reports decreased fetal movements during pregnancy. The infant has a thin upper lip and almond-shaped eyes. What is the most likely genetic mechanism?',
    '{"A": "Maternal deletion of 15q11-q13", "B": "Paternal deletion of 15q11-q13", "C": "Trisomy 21", "D": "Expansion of CGG repeats in FMR1", "E": "Mutation in CFTR"}',
    'B',
    'medium',
    'Imprinting Disorders',
    'Prader-Willi syndrome is caused by loss of paternally expressed genes in the 15q11-q13 region (paternal deletion or maternal uniparental disomy). It presents with neonatal hypotonia, feeding difficulties, cryptorchidism, and later develops into hyperphagia and obesity.',
    ARRAY['Prader-Willi syndrome', 'imprinting', '15q11-q13', 'paternal deletion', 'hypotonia']
),
(
    '00000000-0000-0000-0000-000000000009'::uuid,
    'A 15-year-old boy presents with progressive vision loss and night blindness. Fundoscopic examination reveals bone-spicule pigmentation in the periphery. His father had similar symptoms. What is the most likely inheritance pattern?',
    '{"A": "Autosomal recessive", "B": "Autosomal dominant", "C": "X-linked recessive", "D": "Mitochondrial", "E": "X-linked dominant"}',
    'B',
    'medium',
    'Ophthalmologic Disorders',
    'Retinitis pigmentosa (RP) can be inherited in multiple patterns. Given the father is affected, autosomal dominant inheritance is most likely. RP is characterized by progressive photoreceptor degeneration, night blindness, peripheral vision loss, and bone-spicule pigmentation on fundoscopy.',
    ARRAY['retinitis pigmentosa', 'autosomal dominant', 'night blindness', 'bone-spicule', 'photoreceptor degeneration']
),
(
    '00000000-0000-0000-0000-000000000010'::uuid,
    'A 2-year-old child presents with multiple café-au-lait spots, axillary freckling, and Lisch nodules of the iris. What is the most likely genetic mechanism?',
    '{"A": "Loss of tumor suppressor gene NF1", "B": "Gain of function in RAS gene", "C": "DNA repair defect in mismatch repair genes", "D": "Expansion of trinucleotide repeats", "E": "Mitochondrial DNA deletion"}',
    'A',
    'easy',
    'Neurocutaneous Disorders',
    'Neurofibromatosis type 1 (NF1) is caused by mutations in the NF1 tumor suppressor gene on chromosome 17. Diagnostic criteria include ≥6 café-au-lait spots, axillary/inguinal freckling, Lisch nodules, neurofibromas, optic glioma, and bone dysplasia.',
    ARRAY['neurofibromatosis type 1', 'NF1', 'tumor suppressor', 'café-au-lait spots', 'Lisch nodules']
),
(
    '00000000-0000-0000-0000-000000000011'::uuid,
    'A 6-month-old infant presents with failure to thrive, hepatomegaly, and hypoglycemia. Laboratory studies show lactic acidosis and hyperlipidemia. Liver biopsy shows glycogen accumulation. Which enzyme deficiency is most likely?',
    '{"A": "Glucose-6-phosphatase", "B": "Acid alpha-glucosidase", "C": "Debranching enzyme", "D": "Phosphofructokinase", "E": "Pyruvate kinase"}',
    'A',
    'hard',
    'Metabolic Disorders',
    'Glycogen storage disease type Ia (von Gierke disease) is caused by glucose-6-phosphatase deficiency. It presents with severe fasting hypoglycemia, hepatomegaly, lactic acidosis, hyperlipidemia, and hyperuricemia. The doll-like face and protuberant abdomen are characteristic.',
    ARRAY['von Gierke disease', 'glucose-6-phosphatase', 'glycogen storage disease', 'hypoglycemia', 'hepatomegaly']
),
(
    '00000000-0000-0000-0000-000000000012'::uuid,
    'A 4-year-old boy presents with progressive muscle weakness, calf pseudohypertrophy, and Gowers sign. His creatine kinase is markedly elevated. What is the inheritance pattern of this condition?',
    '{"A": "Autosomal recessive", "B": "Autosomal dominant", "C": "X-linked recessive", "D": "Mitochondrial", "E": "X-linked dominant"}',
    'C',
    'easy',
    'Neuromuscular Disorders',
    'Duchenne muscular dystrophy (DMD) is an X-linked recessive disorder caused by mutations in the DMD gene encoding dystrophin. It presents with progressive proximal muscle weakness, calf pseudohypertrophy, Gowers sign, and markedly elevated CK. Cardiomyopathy is a common cause of death.',
    ARRAY['Duchenne muscular dystrophy', 'dystrophin', 'X-linked recessive', 'Gowers sign', 'pseudohypertrophy']
),
(
    '00000000-0000-0000-0000-000000000013'::uuid,
    'A newborn infant has ambiguous genitalia, but no other abnormalities. Karyotype is 46,XY. Testosterone levels are low, and LH and FSH are elevated. What is the most likely diagnosis?',
    '{"A": "Complete androgen insensitivity syndrome", "B": "5α-reductase deficiency", "C": "Leydig cell hypoplasia", "D": "Klinefelter syndrome", "E": "Mayer-Rokitansky-Küster-Hauser syndrome"}',
    'C',
    'hard',
    'Disorders of Sexual Development',
    'Leydig cell hypoplasia (LCH) is caused by mutations in the LHCG receptor gene. It results in impaired testosterone production, leading to undervirilization in 46,XY individuals. Elevated LH/FSH with low testosterone and lack of response to hCG stimulation are diagnostic.',
    ARRAY['Leydig cell hypoplasia', 'LHCGR', '46XY DSD', 'ambiguous genitalia', 'testosterone deficiency']
),
(
    '00000000-0000-0000-0000-000000000014'::uuid,
    'A 3-year-old child presents with recurrent infections, eczema, and thrombocytopenia with small platelets. What is the most likely diagnosis?',
    '{"A": "Severe combined immunodeficiency", "B": "Wiskott-Aldrich syndrome", "C": "DiGeorge syndrome", "D": "Chronic granulomatous disease", "E": "Bruton agammaglobulinemia"}',
    'B',
    'medium',
    'Immunodeficiency Disorders',
    'Wiskott-Aldrich syndrome is an X-linked recessive disorder caused by WAS gene mutations. The classic triad includes recurrent infections (due to immunodeficiency), eczema, and thrombocytopenia with small platelets. Platelet size is a key differentiator from ITP.',
    ARRAY['Wiskott-Aldrich syndrome', 'WAS gene', 'thrombocytopenia', 'eczema', 'X-linked recessive']
),
(
    '00000000-0000-0000-0000-000000000015'::uuid,
    'A 25-year-old woman presents with progressive proximal muscle weakness and a "heliotrope" rash on her eyelids. She also has Gottron papules over her knuckles. Which autoantibody is most specific for her condition?',
    '{"A": "Anti-dsDNA", "B": "Anti-Jo-1", "C": "Anti-Sm", "D": "Anti-CCP", "E": "Anti-centromere"}',
    'B',
    'medium',
    'Autoimmune Disorders',
    'Dermatomyositis is an inflammatory myopathy characterized by proximal muscle weakness, heliotrope rash (violaceous periorbital discoloration), and Gottron papules. Anti-Jo-1 antibodies are associated with antisynthetase syndrome and are found in a subset of patients with myositis.',
    ARRAY['dermatomyositis', 'anti-Jo-1', 'heliotrope rash', 'Gottron papules', 'inflammatory myopathy']
);

-- ============================================
-- SAMPLE USER (for testing)
-- ============================================

INSERT INTO users (id, email, display_name, settings) VALUES
    ('00000000-0000-0000-0000-000000000100'::uuid, 'demo@geneason.com', 'Demo User', '{"theme": "light", "preferredCategories": ["Lysosomal Storage Disorders", "Neurologic Disorders"]}'::jsonb);

-- ============================================
-- SAMPLE SESSION (for testing)
-- ============================================

INSERT INTO sessions (id, user_id, status, settings, total_questions, correct_answers) VALUES
    ('00000000-0000-0000-0000-000000000200'::uuid, '00000000-0000-0000-0000-000000000100'::uuid, 'completed', '{"category": "Lysosomal Storage Disorders", "difficulty": "medium", "question_count": 5}'::jsonb, 5, 4);

-- Link session to questions
INSERT INTO session_questions (session_id, question_id, question_order, user_answer, is_correct, time_spent_seconds) VALUES
    ('00000000-0000-0000-0000-000000000200'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 1, 'B', true, 45),
    ('00000000-0000-0000-0000-000000000200'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 2, 'A', false, 60),
    ('00000000-0000-0000-0000-000000000200'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 3, 'A', true, 30),
    ('00000000-0000-0000-0000-000000000200'::uuid, '00000000-0000-0000-0000-000000000004'::uuid, 4, 'A', true, 55),
    ('00000000-0000-0000-0000-000000000200'::uuid, '00000000-0000-0000-0000-000000000005'::uuid, 5, 'A', true, 40);
