
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Seeding availability...');

    // Insert availability for December 20, 2025
    const date = '2025-12-20';

    const { data, error } = await supabase
        .from('date_availability')
        .upsert({
            date: date,
            is_open: true,
            start_time: '09:00:00',
            end_time: '17:00:00',
            max_bookings_per_day: 5
        })
        .select();

    if (error) {
        console.error('Error inserting data:', error);
    } else {
        console.log('Successfully inserted availability for:', date);
        console.log(data);
    }
}

seed();
