# Methodologies for Complex Multiple Choice Question Resolution in Medical Education

## Executive Summary

This document explores methodologies for answering complex multiple-choice questions (MCQs) in medical board certification exams, with focus on applications for medical genetics training. The goal is to inform the design of an AI-powered training app using GLM 4.7 for question generation and reasoning.

---

## 1. Cognitive Frameworks for Medical Reasoning

### 1.1 Dual-Process Theory (System 1 vs System 2)

**Description**: The dominant cognitive framework in medical decision-making research.

| System | Characteristics | Role in MCQs |
|--------|-----------------|--------------|
| **System 1** | Fast, automatic, pattern recognition | Initial gut feeling, illness script matching |
| **System 2** | Slow, analytical, deliberate | Complex reasoning, differential discrimination |

**Application to MCQ Training**:
- Train residents to recognize when System 1 is sufficient vs when System 2 is needed
- Build pattern recognition through repeated exposure (illness scripts)
- Develop metacognitive awareness of reasoning processes

**References**: Norman et al., Croskerry, Eva

### 1.2 Illness Script Theory

**Description**: Medical knowledge is organized as cognitive scripts containing:
- Enabling conditions (risk factors, demographics)
- Faults (pathophysiological mechanisms)
- Consequences (signs, symptoms, findings)

**Application to MCQ Training**:
- Build rich illness scripts through case exposure
- Compare and contrast similar scripts to discriminate among options
- Use script activation as the primary mechanism for diagnosis

**Relevance to Genetics**: Genetic conditions have well-defined scripts with:
- Inheritance patterns (enabling conditions)
- Molecular mechanisms (faults)
- Phenotypic manifestations (consequences)

### 1.3 Semantic Networks and Knowledge Graphs

**Description**: Knowledge represented as nodes (concepts) connected by edges (relationships).

**Types of Relationships**:
- IS-A (inheritance): Cystic fibrosis IS-A autosomal recessive disorder
- HAS-SYMPTOM: Marfan syndrome HAS-SYMPTOM aortic dilation
- CAUSED-BY: Phenylketonuria CAUSED-BY PAH gene mutation
- TREATED-BY: Homocystinuria TREATED-BY pyridoxine

**Application to MCQ Training**:
- Traverse knowledge graph from stem findings to diagnosis
- Identify missing links that differentiate similar conditions
- Visualize reasoning path for feedback

---

## 2. Reasoning Approaches for MCQ Resolution

### 2.1 Association-Based Approach (Your Proposed Method)

**Mechanism**: Build semantic associations from clinical stem to discriminate among options.

**Strengths**:
- Mirrors expert clinical reasoning
- Explicitly shows reasoning chain
- Helps identify knowledge gaps
- Good for complex discrimination

**Limitations**:
- May be slow for straightforward questions
- Requires well-structured knowledge base
- Can lead to over-analysis

### 2.2 Bayesian Probabilistic Reasoning

**Mechanism**: Update probability estimates for each option based on evidence in the stem.

**Process**:
1. Start with prior probabilities (prevalence, baseline risk)
2. Update with each finding from the stem
3. Calculate posterior probability for each option
4. Select option with highest posterior

**Example for Genetics**:
```
Prior: Duchenne muscular dystrophy prevalence in males: 1/3500
Finding 1: Male child (LR: 3500x more likely than female)
Finding 2: Calf pseudohypertrophy (LR: 10x)
Finding 3: Elevated CK (LR: 50x)
Finding 4: Gowers sign (LR: 8x)
Finding 5: X-linked family history (LR: 20x)
→ Posterior strongly favors DMD
```

**Strengths**:
- Quantifies uncertainty
- Handles partial information
- Explicitly weighs evidence
- Good for probability-based questions

**Limitations**:
- Requires accurate likelihood ratios
- Computationally intensive
- May not match intuitive clinical reasoning

### 2.3 Hypothetico-Deductive Method

**Mechanism**: Generate early hypotheses, then systematically test them against stem data.

**Process**:
1. Generate 3-5 leading hypotheses from initial cues
2. For each hypothesis, identify discriminating features
3. Search stem for presence/absence of these features
4. Eliminate hypotheses that dont fit
5. Select best-supported hypothesis

**Strengths**:
- Mirrors clinical diagnostic process
- Efficient for complex cases
- Good for differential diagnosis questions

**Limitations**:
- Can be biased by early hypothesis generation
- May miss unexpected diagnoses

### 2.4 Pattern Recognition (Script Activation)

**Mechanism**: Rapidly match stem features to stored illness scripts.

**Process**:
1. Extract key features from stem
2. Activate matching scripts from memory
3. Compare activated scripts to stem details
4. Select best-matching script

**Strengths**:
- Fast and efficient
- Works well for classic presentations
- Develops with expertise

**Limitations**:
- Fails for atypical presentations
- Requires extensive script library
- Prone to availability bias

### 2.5 Constraint Satisfaction

**Mechanism**: Each finding in the stem constrains the possible answer space.

**Process**:
1. Start with all possible answers
2. Apply each stem finding as a constraint
3. Eliminate options that violate constraints
4. Select from remaining options

**Example**:
```
Stem: A 6-month-old infant with failure to thrive, hepatosplenomegaly, and developmental regression.

Constraint 1: Age 6 months → Eliminate late-onset disorders
Constraint 2: Hepatosplenomegaly → Focus on storage disorders
Constraint 3: Developmental regression → Suggests neurodegenerative
Constraint 4: Failure to thrive → Metabolic involvement

Remaining candidates: Tay-Sachs, Niemann-Pick, Gaucher, etc.
Apply more constraints from stem details...
```

**Strengths**:
- Systematic elimination
- Good for discrimination
- Explicit reasoning trail

**Limitations**:
- Requires clear constraints
- May not work for best-answer (not only-answer) questions

### 2.6 Argument-Based Approach

**Mechanism**: Construct arguments for and against each option.

**Process**:
1. For each option, list supporting evidence from stem
2. For each option, list contradicting evidence
3. Weigh strength of arguments
4. Select option with strongest net support

**Strengths**:
- Explicit consideration of all options
- Reduces premature closure
- Good for best-answer questions

**Limitations**:
- Time-consuming
- May lead to overthinking

---

## 3. Hybrid Approaches

### 3.1 Two-Phase Reasoning

**Phase 1 - Pattern Recognition**: Quick script activation to generate candidate answers
**Phase 2 - Analytical Verification**: Use constraint satisfaction or Bayesian reasoning to verify

### 3.2 Knowledge Graph + Bayesian

Combine semantic associations with probabilistic reasoning:
- Use knowledge graph to identify relevant relationships
- Apply Bayesian updates along graph edges
- Calculate path probabilities to each option

### 3.3 Argument Mapping + Constraints

- Build argument maps for each option
- Apply constraints to eliminate weak arguments
- Visualize the reasoning landscape

---

## 4. AI/LLM-Specific Approaches

### 4.1 Chain-of-Thought (CoT) Prompting

**Description**: LLM generates explicit reasoning steps before answering.

**Application**:
```
Question: [clinical stem with options]

Think step-by-step:
1. What are the key findings in this case?
2. What is the most likely category of disorder?
3. What findings support or contradict each option?
4. Which option best fits all the evidence?
```

### 4.2 Tree-of-Thought (ToT) Reasoning

**Description**: Explore multiple reasoning paths in parallel.

**Application**:
- Generate separate reasoning chains for each option
- Compare and evaluate paths
- Select most coherent reasoning

### 4.3 Retrieval-Augmented Generation (RAG)

**Description**: Ground reasoning in retrieved authoritative sources.

**Application**:
- Retrieve relevant textbook sections
- Retrieve similar PubMed cases
- Generate reasoning grounded in evidence

### 4.4 Knowledge Graph-Enhanced LLM

**Description**: Combine LLM reasoning with structured knowledge graphs.

**Application**:
- LLM extracts entities from stem
- Knowledge graph provides relationships
- LLM reasons over graph structure
- Generate explanation path

---

## 5. Comparison of Approaches for Medical Genetics MCQs

| Approach | Best For | Complexity | Training Value |
|----------|----------|------------|----------------|
| Association/Graph | Discrimination among similar conditions | High | Excellent |
| Bayesian | Probability-based questions | High | Good |
| Hypothetico-Deductive | Differential diagnosis | Medium | Excellent |
| Pattern Recognition | Classic presentations | Low | Moderate |
| Constraint Satisfaction | Systematic elimination | Medium | Good |
| Argument-Based | Best-answer questions | High | Excellent |
| Hybrid (Two-Phase) | Complex cases | High | Excellent |

---

## 6. Recommendations for App Design

### 6.1 Primary Methodology: Hybrid Knowledge Graph + Argument-Based

**Rationale**:
- Knowledge graphs provide explicit semantic associations (your core idea)
- Argument-based reasoning ensures all options are considered
- Combines intuitive and analytical reasoning

### 6.2 Secondary Methodologies to Include

1. **Constraint Satisfaction**: For systematic elimination
2. **Bayesian Updates**: For probability-weighted questions
3. **Illness Script Comparison**: For pattern recognition training

### 6.3 LLM Integration Strategy

```
1. Question Generation: GLM-4 + RAG from textbooks/PubMed
2. Knowledge Graph Construction: GLM-4 extracts entities and relationships
3. Reasoning Generation: Chain-of-thought over knowledge graph
4. Explanation: Multi-path reasoning with argument comparison
```

### 6.4 User Interaction Model

1. Present clinical stem
2. User identifies key findings (entity extraction practice)
3. User builds associations (graph construction practice)
4. User selects answer
5. App shows:
   - Correct answer
   - Full knowledge graph with all relevant associations
   - Step-by-step reasoning for correct answer
   - Analysis of why each distractor is wrong
   - Alternative reasoning paths (Bayesian, constraint-based)

---

## 7. Key Research References

### Cognitive Science in Medical Education
- Croskerry P. A universal model of diagnostic reasoning. Acad Med. 2009
- Norman GR et al. The causes of errors in clinical reasoning. Acad Med. 2017
- Eva KW. What every teacher needs to know about clinical reasoning. Med Educ. 2005

### Illness Scripts
- Schmidt HG et al. A cognitive perspective on medical expertise. Acad Med. 1990
- Custers EJFM. Thirty years of illness scripts. Perspect Med Educ. 2015

### Knowledge Graphs in Medicine
- Rotmensch M et al. Building a knowledge graph from medical textbooks. Sci Data. 2017
- Shen Y et al. Knowledge graph-based clinical decision support system. JAMIA. 2022

### LLM for Medical MCQs
- Singhal K et al. Large language models encode clinical knowledge. Nature. 2023
- Lievin V et al. Can large language models reason about medical questions? arXiv. 2023

### Bayesian Reasoning in Medicine
- Gill CJ et al. A practical guide to Bayesian statistics. Med Decis Making. 2004
- Phelps MA, Lehann MA. A simple algorithm for Bayesian diagnosis. JAMIA. 2004

---

## 8. Conclusion

Association-based reasoning using knowledge graphs is an excellent primary approach but should be supplemented with:

1. **Constraint satisfaction** for systematic elimination
2. **Bayesian reasoning** for probability questions
3. **Argument-based analysis** for comprehensive option evaluation
4. **Illness script comparison** for pattern recognition development

The hybrid approach provides:
- Multiple reasoning pathways for robustness
- Explicit reasoning trails for learning
- Flexibility for different question types
- Alignment with both expert cognition and AI capabilities

---

*Document created for planning purposes - Medical Genetics MCQ Training App*
