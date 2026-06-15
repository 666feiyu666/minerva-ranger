// src/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://iuwxkujtandmxorydaqs.supabase.co'
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1d3hrdWp0YW5kbXhvcnlkYXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzA0NDksImV4cCI6MjA4NTUwNjQ0OX0.1eEJUFLAmJ5MJ4Bo8OQFeD4EjmCBTVpJ6fxLQDoq7Y4'

export const supabase = createClient(supabaseUrl, supabaseKey)
