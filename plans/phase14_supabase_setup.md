# Phase 14: Supabase Database Setup Guide

This guide walks you through setting up Supabase for the GeneReason application.

## Prerequisites

- A Supabase account (free tier works for development)
- The GeneReason backend running locally

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the details:
   - **Name**: GeneReason (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for it to be provisioned (~2 minutes)

## Step 2: Get API Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (click "Reveal" to see it)

## Step 3: Run Database Schema

1. In Supabase, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `backend/app/core/schema.sql`
4. Paste it into the editor
5. Click "Run" to execute the schema

You should see "Success. No rows returned" which means the schema was created successfully.

## Step 4: Configure Backend Environment

1. Copy the example environment file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` and update the Supabase settings:
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Feature Flags - Disable mock data
   USE_MOCK_DATA=false
   ```

## Step 5: Seed Initial Data (Optional)

To add sample questions for testing, run the seed script in Supabase SQL Editor:

```sql
-- Insert sample questions
INSERT INTO questions (id, stem, options, correct_answer, difficulty, category, explanation, key_concepts) VALUES
(
    'q001'::uuid,
    'A 4-month-old infant presents with failure to thrive, hepatosplenomegaly, and developmental regression. Physical exam reveals cherry-red spot in the macula. Laboratory studies show normal liver enzymes but absent hexosaminidase A activity in leukocytes.',
    '{"A": "Niemann-Pick disease type A", "B": "Tay-Sachs disease", "C": "Gaucher disease type 1", "D": "Fabry disease", "E": "Krabbe disease"}',
    'B',
    'medium',
    'Lysosomal Storage Disorders',
    'Tay-Sachs disease is characterized by absent hexosaminidase A activity, cherry-red spot, and neurodegeneration without hepatosplenomegaly (which would suggest Niemann-Pick).',
    ARRAY['hexosaminidase A', 'cherry-red spot', 'lysosomal storage disease']
),
(
    'q002'::uuid,
    'A 6-year-old boy presents with progressive ataxia, areflexia, and loss of vibration sense. Laboratory studies reveal elevated phytanic acid levels. Which inheritance pattern is most likely?',
    '{"A": "Autosomal dominant", "B": "Autosomal recessive", "C": "X-linked recessive", "D": "Mitochondrial", "E": "X-linked dominant"}',
    'B',
    'hard',
    'Neurologic Disorders',
    'Refsum disease is an autosomal recessive peroxisomal disorder characterized by elevated phytanic acid due to deficiency in phytanoyl-CoA hydroxylase.',
    ARRAY['phytanic acid', 'peroxisomal disorder', 'ataxia', 'autosomal recessive']
),
(
    'q003'::uuid,
    'A newborn is found to have ambiguous genitalia, hypotension, and hyponatremia with hyperkalemia. Which enzyme deficiency is most likely?',
    '{"A": "21-hydroxylase", "B": "11β-hydroxylase", "C": "17α-hydroxylase", "D": "3β-hydroxysteroid dehydrogenase", "E": "Aromatase"}',
    'A',
    'medium',
    'Endocrine Disorders',
    '21-hydroxylase deficiency is the most common cause of congenital adrenal hyperplasia, presenting with salt-wasting (hyponatremia, hyperkalemia) and virilization.',
    ARRAY['congenital adrenal hyperplasia', '21-hydroxylase', 'salt-wasting', 'ambiguous genitalia']
),
(
    'q004'::uuid,
    'A 2-year-old girl presents with developmental delay, seizures, and a "tapetoretinal" degeneration. Brain MRI shows diffuse white matter abnormalities. Which finding would be most specific for the diagnosis?',
    '{"A": "Elevated very long-chain fatty acids", "B": "Elevated phytanic acid", "C": "Elevated pipecolic acid", "D": "Elevated methylmalonic acid", "E": "Elevated orotic acid"}',
    'A',
    'hard',
    'Neurologic Disorders',
    'X-linked adrenoleukodystrophy is characterized by elevated very long-chain fatty acids (VLCFA) due to ABCD1 gene mutation affecting peroxisomal beta-oxidation.',
    ARRAY['adrenoleukodystrophy', 'VLCFA', 'peroxisomal disorder', 'white matter disease']
),
(
    'q005'::uuid,
    'A 3-month-old infant presents with severe hypotonia, feeding difficulties, and "frog-leg" positioning. EMG shows fibrillations and positive sharp waves. Which genetic finding is most likely?',
    '{"A": "SMN1 deletion", "B": "MECP2 mutation", "C": "DMD deletion", "D": "PAH mutation", "E": "CFTR mutation"}',
    'A',
    'easy',
    'Neuromuscular Disorders',
    'Spinal muscular atrophy (SMA) type 1 (Werdnig-Hoffmann disease) is caused by SMN1 gene deletion, presenting with severe hypotonia and "floppy infant" syndrome.',
    ARRAY['spinal muscular atrophy', 'SMN1', 'hypotonia', 'anterior horn cell']
);
```

## Step 6: Verify Connection

1. Start the backend:
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8002
   ```

2. Check the console output for:
   ```
   ✓ Supabase connection established
   ```

3. Test the API:
   ```bash
   curl http://localhost:8002/api/v1/questions
   ```

## Step 7: Configure Row Level Security (Production)

For production use, ensure RLS policies are properly configured:

1. In Supabase, go to **Authentication** → **Policies**
2. Review the policies created by the schema
3. For production, you may want to:
   - Enable email confirmation
   - Configure OAuth providers
   - Set up custom email templates

## Troubleshooting

### "Supabase connection failed"
- Verify your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check that the schema was run successfully
- Ensure your IP is not blocked (Supabase has IP restrictions in some regions)

### "Using mock data (Supabase not configured)"
- Check that `USE_MOCK_DATA=false` in your `.env` file
- Verify the `.env` file is in the `backend/` directory
- Restart the server after changing environment variables

### "Permission denied" errors
- Ensure you're using the `service_role` key for backend operations
- Check RLS policies are correctly configured
- Verify the table exists in Supabase dashboard

## Next Steps

After Supabase is configured:
1. Set up FalkorDB for knowledge graph storage (Phase 14 continued)
2. Configure real LLM integration (Phase 15)
3. Enable user authentication (Phase 16)
