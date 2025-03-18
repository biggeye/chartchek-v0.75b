#!/usr/bin/env node

/**
 * Supabase Types Generator
 * 
 * This script generates TypeScript types from your Supabase database schema.
 * It uses the Supabase CLI and outputs the types to a file for review.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const outputFile = path.join(__dirname, '..', 'types', 'supabase-types.ts');
const outputDir = path.join(__dirname, '..', 'types');

// Create types directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('📁 Created types directory');
}

console.log('🔄 Generating Supabase types...');

// Check if Supabase CLI is installed
try {
  const supabaseVersion = execSync('npx supabase --version').toString().trim();
  console.log(`✅ Supabase CLI detected: ${supabaseVersion}`);
} catch (error) {
  console.error('❌ Supabase CLI not found. Please install it with: npm install -g supabase');
  process.exit(1);
}

// Get Supabase URL and key from .env.local file
const envFile = path.join(__dirname, '..', '.env.local');
let supabaseUrl, supabaseKey;

if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
  
  supabaseUrl = urlMatch && urlMatch[1];
  supabaseKey = keyMatch && keyMatch[1];
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Could not find Supabase URL or key in .env.local file');
    process.exit(1);
  }
} else {
  console.error('❌ .env.local file not found');
  process.exit(1);
}

// Generate types
try {
  console.log('🔄 Connecting to Supabase and generating types...');
  
  // Run the Supabase CLI command to generate types
  const output = execSync(`npx supabase gen types typescript --db-url "${supabaseUrl}" --schema public`, { 
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Save the output to the file
  fs.writeFileSync(outputFile, output);
  console.log(`✅ Types generated successfully and saved to ${outputFile}`);
  
  // Display a preview of the generated types
  console.log('\n📄 Preview of generated types:');
  const preview = fs.readFileSync(outputFile, 'utf8')
    .split('\n')
    .slice(0, 20)
    .join('\n');
  
  console.log(preview);
  console.log('... (more types in the file)');
  
} catch (error) {
  console.error('❌ Error generating types:', error.message);
  fs.writeFileSync(path.join(outputDir, 'supabase-error.log'), error.toString());
  process.exit(1);
}

console.log('\n✨ Done! You can now review the types in types/supabase-types.ts');
console.log('Next steps:');
console.log('1. Review the generated types');
console.log('2. Update your TypeScript interfaces to match the database schema');
console.log('3. Use these types in your application code');

// Alternative approach using the Supabase JavaScript client
console.log('\n💡 Alternative approach:');
console.log('If you prefer to use the Supabase JavaScript client instead of the CLI,');
console.log('you can add this to your package.json scripts:');
console.log('  "generate-types": "supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts"');
console.log('Then run: npm run generate-types');
