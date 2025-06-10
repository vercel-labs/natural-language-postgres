import { createClient } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';
import "dotenv/config"

// Create client instead of using default pool
const client = createClient({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});

function parseDate(dateString: string): string {
  if (!dateString) {
    console.warn(`Date string is undefined or empty`);
    return new Date().toISOString().split('T')[0]; // Return today's date as fallback
  }
  
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    let year = parts[2];
    
    // Handle 2-digit years - convert to 4-digit
    if (year.length === 2) {
      const twoDigitYear = parseInt(year);
      // If year is 00-30, it's 20XX; if 31-99, it's 19XX
      if (twoDigitYear <= 30) {
        year = (2000 + twoDigitYear).toString();
      } else {
        year = (1900 + twoDigitYear).toString();
      }
    }
    
    return `${year}-${month}-${day}`;
  }
  console.warn(`Could not parse date: ${dateString}`);
  throw Error();
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

export async function seed() {
  // Connect to the client
  await client.connect();
  
  const createTable = await client.sql`
    CREATE TABLE IF NOT EXISTS unicorns (
      id SERIAL PRIMARY KEY,
      company VARCHAR(255) NOT NULL UNIQUE,
      valuation DECIMAL(10, 2) NOT NULL,
      date_joined DATE,
      country VARCHAR(255) NOT NULL,
      city VARCHAR(255) NOT NULL,
      industry VARCHAR(255) NOT NULL,
      select_investors TEXT NOT NULL
    );
  `;

  console.log(`Created "unicorns" table`);

  // Read the raw file and process it manually
  const csvFilePath = path.join(process.cwd(), 'unicorns.csv');
  const rawContent = fs.readFileSync(csvFilePath, 'utf8');
  const lines = rawContent.split('\n');
  
  // We know the headers are at line 3 and data starts at line 4
  const headerLineIndex = 3;
  const dataLines = lines.slice(headerLineIndex + 1).filter(line => line.trim());
  
  console.log(`Processing ${dataLines.length} data lines`);
  
  let processedCount = 0;
  let errorCount = 0;
  
  for (const line of dataLines) {
    try {
      // Parse the CSV line properly handling quoted fields
      const columns = parseCSVLine(line);
      
      // Skip lines that don't have enough columns or start with empty values
      if (columns.length < 7 || !columns[1]) continue;
      
      const company = columns[1];
      const valuationStr = columns[2].replace('$', '').replace(',', '').trim();
      const valuation = parseFloat(valuationStr);
      const dateJoined = columns[3];
      const country = columns[4];
      const city = columns[5] || '';
      const industry = columns[6];
      const investors = columns[7] || '';
      
      if (!company || isNaN(valuation)) continue;
      
      const formattedDate = parseDate(dateJoined);

      await client.sql`
        INSERT INTO unicorns (company, valuation, date_joined, country, city, industry, select_investors)
        VALUES (
          ${company},
          ${valuation},
          ${formattedDate},
          ${country},
          ${city},
          ${industry},
          ${investors}
        )
        ON CONFLICT (company) DO NOTHING;
      `;
      
      processedCount++;
      
      if (processedCount <= 10) {
        console.log(`✓ Inserted: ${company} - $${valuation}B (${formattedDate})`);
      } else if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount} records...`);
      }
    } catch (error) {
      errorCount++;
      if (errorCount <= 5) {
        console.warn(`Error processing line: ${line.substring(0, 100)}...`);
        console.warn(error.message);
      }
    }
  }

  console.log(`\n🎉 Successfully seeded ${processedCount} unicorns`);
  if (errorCount > 0) {
    console.log(`⚠️  Skipped ${errorCount} rows due to errors`);
  }
  
  // Close the connection
  await client.end();

  return {
    createTable,
    unicorns: processedCount,
  };
}

seed().catch(console.error);