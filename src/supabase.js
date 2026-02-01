// src/supabase.js
import { createClient } from '@supabase/supabase-js'

// 最好放到环境变量里，但为了测试先直接填
const supabaseUrl = 'https://iuwxkujtandmxorydaqs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1d3hrdWp0YW5kbXhvcnlkYXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzA0NDksImV4cCI6MjA4NTUwNjQ0OX0.1eEJUFLAmJ5MJ4Bo8OQFeD4EjmCBTVpJ6fxLQDoq7Y4'

export const supabase = createClient(supabaseUrl, supabaseKey)